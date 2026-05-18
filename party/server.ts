// PartyKit server: 1 sala por jogo. Mantem GameState autoritativo.
// Clientes enviam Action -> servidor aplica via applyAction -> broadcast.
import type * as Party from 'partykit/server';
import type { Action, GameState, PlayerId } from '../src/engine/types';
import { applyAction, createInitialState } from '../src/engine/engine';
import { DECKS } from '../src/data/decks';

type ClientId = string;

interface ClientToServer {
  type: 'JOIN' | 'ACTION' | 'START' | 'PING';
  action?: Action;
}

interface ServerToClient {
  type: 'STATE' | 'ROLE' | 'PLAYERS' | 'ERROR';
  state?: GameState;
  myRole?: PlayerId | 'spectator';
  players?: Array<{ id: ClientId; role: PlayerId | 'spectator' }>;
  error?: string;
}

export default class GameRoom implements Party.Server {
  state: GameState | null = null;
  roles = new Map<ClientId, PlayerId | 'spectator'>();

  constructor(readonly room: Party.Room) {}

  private assignRole(_connId: ClientId): PlayerId | 'spectator' {
    const usados = new Set(this.roles.values());
    if (!usados.has('P1')) return 'P1';
    if (!usados.has('P2')) return 'P2';
    return 'spectator';
  }

  private broadcast(msg: ServerToClient): void {
    const json = JSON.stringify(msg);
    for (const conn of this.room.getConnections()) {
      conn.send(json);
    }
  }

  private send(conn: Party.Connection, msg: ServerToClient): void {
    conn.send(JSON.stringify(msg));
  }

  private playersList() {
    return Array.from(this.roles.entries()).map(([id, role]) => ({ id, role }));
  }

  onConnect(conn: Party.Connection): void {
    const role = this.assignRole(conn.id);
    this.roles.set(conn.id, role);
    this.send(conn, { type: 'ROLE', myRole: role });
    this.broadcast({ type: 'PLAYERS', players: this.playersList() });
    if (this.state) {
      this.send(conn, { type: 'STATE', state: this.state });
    }
  }

  onClose(conn: Party.Connection): void {
    this.roles.delete(conn.id);
    this.broadcast({ type: 'PLAYERS', players: this.playersList() });
  }

  onMessage(message: string, sender: Party.Connection): void {
    let msg: ClientToServer;
    try { msg = JSON.parse(message); }
    catch { this.send(sender, { type: 'ERROR', error: 'invalid_json' }); return; }

    const role = this.roles.get(sender.id);
    if (msg.type === 'PING') return;

    if (msg.type === 'START') {
      if (role !== 'P1') {
        this.send(sender, { type: 'ERROR', error: 'so_p1_pode_iniciar' });
        return;
      }
      const presentes = new Set(this.roles.values());
      if (!presentes.has('P1') || !presentes.has('P2')) {
        this.send(sender, { type: 'ERROR', error: 'falta_segundo_jogador' });
        return;
      }
      this.state = createInitialState(
        DECKS.apostolos(),
        DECKS.filisteus(),
        `s-${this.room.id}-${Date.now()}`,
      );
      this.state = { ...this.state, pendingHandoff: false };
      this.broadcast({ type: 'STATE', state: this.state });
      return;
    }

    if (msg.type === 'ACTION') {
      if (!this.state) { this.send(sender, { type: 'ERROR', error: 'jogo_nao_iniciado' }); return; }
      if (role !== 'P1' && role !== 'P2') { this.send(sender, { type: 'ERROR', error: 'spectator_nao_joga' }); return; }
      if (this.state.turnoDe !== role) { this.send(sender, { type: 'ERROR', error: 'nao_e_o_teu_turno' }); return; }
      if (!msg.action) { this.send(sender, { type: 'ERROR', error: 'sem_action' }); return; }
      const next = applyAction(this.state, msg.action);
      this.state = { ...next, pendingHandoff: false };
      this.broadcast({ type: 'STATE', state: this.state });
      return;
    }
  }
}
