import { create } from 'zustand';
import { PartySocket } from 'partysocket';
import type { Action, GameState, PlayerId } from '../engine/types';
import { applyAction, createInitialState } from '../engine/engine';
import { DECKS } from '../data/decks';

export type Mode = 'hotseat' | 'online' | null;

interface PartyRole {
  myRole: PlayerId | 'spectator';
}

interface GameStoreState {
  state: GameState | null;
  mode: Mode;
  // UI ephemeral selection
  selectedHandIdx: number | null;
  selectedAttackIdx: number | null;
  // Online-only
  roomId: string | null;
  myRole: PlayerId | 'spectator' | null;
  socket: PartySocket | null;
  connecting: boolean;
  connectionError: string | null;
  presentPlayers: Array<{ id: string; role: PlayerId | 'spectator' }>;

  // Hot-seat
  startHotseat: (seed?: string) => void;
  // Online
  connectOnline: (roomId: string) => Promise<PartyRole>;
  startOnlineGame: () => void;
  // Common
  dispatch: (a: Action) => void;
  reset: () => void;
  selectHandCard: (idx: number | null) => void;
  selectAttack: (idx: number | null) => void;
}

// Host do PartyKit — em produção lê da env via build-time.
// Em dev local, usa localhost:1999 (default do partykit dev).
const PARTYKIT_HOST: string =
  (import.meta as any).env?.VITE_PARTYKIT_HOST || 'localhost:1999';

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: null,
  mode: null,
  selectedHandIdx: null,
  selectedAttackIdx: null,
  roomId: null,
  myRole: null,
  socket: null,
  connecting: false,
  connectionError: null,
  presentPlayers: [],

  startHotseat: (seed) => {
    const s = createInitialState(
      DECKS.apostolos(),
      DECKS.filisteus(),
      seed ?? `s-${Date.now()}`,
    );
    set({ state: s, mode: 'hotseat', selectedHandIdx: null, selectedAttackIdx: null });
  },

  connectOnline: (roomId) => {
    return new Promise<PartyRole>((resolve, reject) => {
      // Fecha socket existente
      get().socket?.close();
      set({
        mode: 'online',
        roomId,
        socket: null,
        myRole: null,
        state: null,
        connecting: true,
        connectionError: null,
        presentPlayers: [],
      });

      let resolved = false;
      const sock = new PartySocket({
        host: PARTYKIT_HOST,
        room: roomId,
      });

      sock.addEventListener('open', () => {
        set({ socket: sock, connecting: false });
      });

      sock.addEventListener('error', () => {
        if (!resolved) {
          resolved = true;
          set({ connecting: false, connectionError: 'Erro de ligacao ao servidor.' });
          reject(new Error('socket error'));
        }
      });

      sock.addEventListener('close', () => {
        set({ socket: null });
      });

      sock.addEventListener('message', (ev: MessageEvent) => {
        let m: any;
        try { m = JSON.parse(ev.data); } catch { return; }
        if (m.type === 'ROLE') {
          set({ myRole: m.myRole });
          if (!resolved) {
            resolved = true;
            resolve({ myRole: m.myRole });
          }
        } else if (m.type === 'STATE') {
          set({ state: m.state, selectedHandIdx: null, selectedAttackIdx: null });
        } else if (m.type === 'PLAYERS') {
          set({ presentPlayers: m.players });
        } else if (m.type === 'ERROR') {
          set({ connectionError: m.error });
        }
      });
    });
  },

  startOnlineGame: () => {
    const s = get().socket;
    if (!s) return;
    s.send(JSON.stringify({ type: 'START' }));
  },

  dispatch: (a) => {
    const { mode, state, socket, myRole } = get();
    if (mode === 'online') {
      if (!socket) return;
      // No online, so envia se for a tua vez
      if (state && myRole !== state.turnoDe) return;
      socket.send(JSON.stringify({ type: 'ACTION', action: a }));
      return;
    }
    // hotseat
    if (!state) return;
    set({ state: applyAction(state, a), selectedHandIdx: null, selectedAttackIdx: null });
  },

  reset: () => {
    get().socket?.close();
    set({
      state: null,
      mode: null,
      roomId: null,
      myRole: null,
      socket: null,
      connecting: false,
      connectionError: null,
      presentPlayers: [],
      selectedHandIdx: null,
      selectedAttackIdx: null,
    });
  },

  selectHandCard: (idx) => set({ selectedHandIdx: idx, selectedAttackIdx: null }),
  selectAttack: (idx) => set({ selectedAttackIdx: idx, selectedHandIdx: null }),
}));

export function makeRoomCode(): string {
  // 5 letras maiusculas, sem vogais ambiguas (sem I,O,U,Q para nao confundir)
  const alpha = 'ABCDEFGHJKLMNPRSTVWXYZ';
  let s = '';
  for (let i = 0; i < 5; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}
