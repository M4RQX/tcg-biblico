import { create } from 'zustand';
import Peer, { type DataConnection } from 'peerjs';
import type { Action, GameState, PlayerId } from '../engine/types';
import { applyAction, createInitialState, validateAction } from '../engine/engine';
import { DECKS } from '../data/decks';

export type Mode = 'hotseat' | 'online' | null;

interface PartyRole { myRole: PlayerId | 'spectator'; }

export type ToastKind = 'erro' | 'info' | 'ok';
export interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}

interface GameStoreState {
  state: GameState | null;
  mode: Mode;
  selectedHandIdx: number | null;
  selectedAttackIdx: number | null;
  // Avisos didacticos
  toast: ToastMsg | null;
  // Online (P2P)
  roomId: string | null;
  myRole: PlayerId | 'spectator' | null;
  peer: Peer | null;
  conn: DataConnection | null;
  connecting: boolean;
  connectionError: string | null;
  presentPlayers: Array<{ id: string; role: PlayerId | 'spectator' }>;

  startHotseat: (seed?: string) => void;
  connectOnline: (roomId: string, asHost: boolean) => Promise<PartyRole>;
  startOnlineGame: () => void;
  dispatch: (a: Action) => void;
  tryAction: (a: Action) => boolean;
  notify: (text: string, kind?: ToastKind) => void;
  dismissToast: () => void;
  reset: () => void;
  selectHandCard: (idx: number | null) => void;
  selectAttack: (idx: number | null) => void;
}

const PEER_PREFIX = 'tcgb-';

type Msg =
  | { type: 'ROLE'; myRole: PlayerId | 'spectator' }
  | { type: 'STATE'; state: GameState }
  | { type: 'ACTION'; action: Action }
  | { type: 'PRESENT'; players: Array<{ id: string; role: PlayerId | 'spectator' }> };

function safeSend(conn: DataConnection | null, msg: Msg) {
  if (!conn || !conn.open) return;
  conn.send(msg);
}

let _toastId = 0;

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: null,
  mode: null,
  selectedHandIdx: null,
  selectedAttackIdx: null,
  toast: null,
  roomId: null,
  myRole: null,
  peer: null,
  conn: null,
  connecting: false,
  connectionError: null,
  presentPlayers: [],

  startHotseat: (seed) => {
    const s = createInitialState(
      DECKS.apostolos(),
      DECKS.filisteus(),
      seed ?? `s-${Date.now()}`,
    );
    set({ state: s, mode: 'hotseat', selectedHandIdx: null, selectedAttackIdx: null, toast: null });
  },

  connectOnline: (roomId, asHost) => {
    return new Promise<PartyRole>((resolve, reject) => {
      try { get().conn?.close(); } catch { /* ignore */ }
      try { get().peer?.destroy(); } catch { /* ignore */ }

      const peerId = PEER_PREFIX + roomId;
      set({
        mode: 'online',
        roomId,
        peer: null, conn: null,
        myRole: null, state: null,
        connecting: true, connectionError: null,
        presentPlayers: asHost ? [{ id: 'host', role: 'P1' }] : [],
      });

      let resolved = false;
      const failTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          set({ connecting: false, connectionError: 'Tempo esgotado a ligar.' });
          reject(new Error('timeout'));
        }
      }, 15000);

      if (asHost) {
        const peer = new Peer(peerId, { debug: 1 });

        peer.on('open', () => {
          set({ peer, myRole: 'P1', connecting: false });
          if (!resolved) {
            resolved = true;
            clearTimeout(failTimer);
            resolve({ myRole: 'P1' });
          }
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          const msg =
            err.type === 'unavailable-id' ? 'Codigo de sala ja em uso. Tenta outro.'
            : err.type === 'network' ? 'Erro de rede.'
            : err.message || 'Erro PeerJS.';
          set({ connectionError: msg });
          if (!resolved) {
            resolved = true;
            clearTimeout(failTimer);
            set({ connecting: false });
            reject(err);
          }
        });

        peer.on('connection', (incoming: DataConnection) => {
          if (get().conn?.open) {
            incoming.on('open', () => {
              safeSend(incoming, { type: 'ROLE', myRole: 'spectator' });
              const cur = get().state;
              if (cur) safeSend(incoming, { type: 'STATE', state: cur });
            });
            return;
          }
          incoming.on('open', () => {
            set({
              conn: incoming,
              presentPlayers: [
                { id: 'host', role: 'P1' },
                { id: incoming.peer, role: 'P2' },
              ],
            });
            safeSend(incoming, { type: 'ROLE', myRole: 'P2' });
            safeSend(incoming, {
              type: 'PRESENT',
              players: [
                { id: 'host', role: 'P1' },
                { id: incoming.peer, role: 'P2' },
              ],
            });
            const cur = get().state;
            if (cur) safeSend(incoming, { type: 'STATE', state: cur });
          });
          incoming.on('data', (raw: unknown) => {
            const m = raw as Msg;
            if (m?.type === 'ACTION') {
              const cur = get().state;
              if (!cur) return;
              if (cur.turnoDe !== 'P2') return;
              const next = applyAction(cur, m.action);
              const next2 = { ...next, pendingHandoff: false };
              set({ state: next2, selectedHandIdx: null, selectedAttackIdx: null });
              safeSend(get().conn, { type: 'STATE', state: next2 });
            }
          });
          incoming.on('close', () => {
            set({
              conn: null,
              presentPlayers: [{ id: 'host', role: 'P1' }],
              connectionError: 'O outro jogador saiu.',
            });
          });
        });

      } else {
        const peer = new Peer({ debug: 1 });

        peer.on('open', () => {
          const c = peer.connect(peerId, { reliable: true });

          c.on('open', () => {
            set({ peer, conn: c, connecting: false });
          });

          c.on('data', (raw: unknown) => {
            const m = raw as Msg;
            if (m?.type === 'ROLE') {
              set({ myRole: m.myRole });
              if (!resolved) {
                resolved = true;
                clearTimeout(failTimer);
                resolve({ myRole: m.myRole });
              }
            } else if (m?.type === 'STATE') {
              set({ state: m.state, selectedHandIdx: null, selectedAttackIdx: null });
            } else if (m?.type === 'PRESENT') {
              set({ presentPlayers: m.players });
            }
          });

          c.on('error', (err: { message?: string }) => {
            set({ connectionError: err?.message || 'Erro na conexao.' });
          });

          c.on('close', () => {
            set({ connectionError: 'Ligacao fechada.', conn: null });
          });
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          const msg =
            err.type === 'peer-unavailable' ? 'Sala nao encontrada. Verifica o codigo.'
            : err.type === 'network' ? 'Erro de rede.'
            : err.message || 'Erro PeerJS.';
          set({ connectionError: msg });
          if (!resolved) {
            resolved = true;
            clearTimeout(failTimer);
            set({ connecting: false });
            reject(err);
          }
        });
      }
    });
  },

  startOnlineGame: () => {
    const { myRole, conn } = get();
    if (myRole !== 'P1' || !conn?.open) return;
    const s = createInitialState(
      DECKS.apostolos(),
      DECKS.filisteus(),
      `s-${get().roomId}-${Date.now()}`,
    );
    const s2 = { ...s, pendingHandoff: false };
    set({ state: s2, selectedHandIdx: null, selectedAttackIdx: null, toast: null });
    safeSend(conn, { type: 'STATE', state: s2 });
  },

  // dispatch: aplica a accao sem validar (uso interno / accoes ja validadas).
  dispatch: (a) => {
    const { mode, state, conn, myRole } = get();
    if (mode === 'online') {
      if (!state) return;
      if (state.turnoDe !== myRole) return;
      if (myRole === 'P1') {
        const next = { ...applyAction(state, a), pendingHandoff: false };
        set({ state: next, selectedHandIdx: null, selectedAttackIdx: null });
        safeSend(conn, { type: 'STATE', state: next });
      } else {
        safeSend(conn, { type: 'ACTION', action: a });
      }
      return;
    }
    if (!state) return;
    set({ state: applyAction(state, a), selectedHandIdx: null, selectedAttackIdx: null });
  },

  // tryAction: valida primeiro; se for invalida, mostra um aviso didactico.
  tryAction: (a) => {
    const { mode, state, myRole } = get();
    if (!state) return false;
    if (mode === 'online' && state.turnoDe !== myRole) {
      get().notify('Espera — agora e a vez do adversario.', 'erro');
      return false;
    }
    const v = validateAction(state, a);
    if (!v.ok) {
      get().notify(v.reason ?? 'Essa jogada nao e permitida agora.', 'erro');
      return false;
    }
    get().dispatch(a);
    return true;
  },

  notify: (text, kind = 'info') => {
    set({ toast: { id: ++_toastId, text, kind } });
  },

  dismissToast: () => set({ toast: null }),

  reset: () => {
    try { get().conn?.close(); } catch { /* ignore */ }
    try { get().peer?.destroy(); } catch { /* ignore */ }
    set({
      state: null,
      mode: null,
      roomId: null,
      myRole: null,
      peer: null,
      conn: null,
      connecting: false,
      connectionError: null,
      presentPlayers: [],
      selectedHandIdx: null,
      selectedAttackIdx: null,
      toast: null,
    });
  },

  selectHandCard: (idx) => set({ selectedHandIdx: idx, selectedAttackIdx: null }),
  selectAttack: (idx) => set({ selectedAttackIdx: idx, selectedHandIdx: null }),
}));

export function makeRoomCode(): string {
  const alpha = 'ABCDEFGHJKLMNPRSTVWXYZ';
  let s = '';
  for (let i = 0; i < 5; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}
