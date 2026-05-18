// Tipos fundamentais do TCG Biblico. Sem dependencias de React ou DOM.

export type CardId = string;
export type InstanceId = string;
export type PlayerId = 'P1' | 'P2';

export type EnergyType =
  | 'Generica'
  | 'Fe'
  | 'Coragem'
  | 'Sabedoria'
  | 'Pregacao'
  | 'Zelo'
  | 'Dominio';

export type Faccao =
  | 'Patriarcas'
  | 'Reis'
  | 'Profetas'
  | 'Apostolos'
  | 'Juizes'
  | 'Egipto'
  | 'Filisteus'
  | 'Babilonia'
  | 'Canaa'
  | 'Roma';

export type CardType =
  | 'Fiel'
  | 'Adversario'
  | 'Evento'
  | 'Estrutura'
  | 'Energia';

export interface Attack {
  nome: string;
  custo: EnergyType[];
  dano: number;
  efeitoId?: string;
  texto?: string;
}

export interface CardDef {
  id: CardId;
  nome: string;
  tipo: CardType;
  subtipo?: 'Apoio' | 'Bencao';
  faccao?: Faccao;
  tags: string[];
  custoEnergia: number;
  fornecesEnergia?: EnergyType;     // para cartas Energia
  hp?: number;
  ataques?: Attack[];
  retirada?: number;
  fraqueza?: { faccao: Faccao; mod: '+20' | 'x2' };
  resistencia?: { faccao: Faccao; mod: '-20' };
  evolucaoDe?: CardId;
  unica?: boolean;
  efeitoPassivoId?: string;
  efeitoTexto?: string;
  flavor: string;
}

export type EstadoFiel = 'paralisado' | 'envergonhado' | 'protegido';

export interface CardInstance {
  iid: InstanceId;
  defId: CardId;
  hpMaximoBonus: number;
  hpRestante: number;
  energiasAnexadas: EnergyType[];
  estados: EstadoFiel[];
  turnoEntrouEmJogo: number;
  contadores: Record<string, number>;
  jaAtacouEsteTurno: boolean;
  evolucoes: CardId[];
}

export interface LogEntry {
  turno: number;
  jogador: PlayerId;
  texto: string;
}

export interface PlayerState {
  id: PlayerId;
  faccaoPrimaria: Faccao;
  baralho: CardDef[];
  mao: CardDef[];
  emConfronto: CardInstance | null;
  companhia: CardInstance[];
  talentos: CardDef[];
  talentosColhidos: CardDef[];
  repouso: CardDef[];
  estruturas: CardInstance[];
  energiaAnexadaEsteTurno: boolean;
  apoioJogadoEsteTurno: boolean;
}

export type Fase = 'aurora' | 'acao' | 'confronto' | 'fim';
export type MotivoVitoria = 'talentos' | 'sem_fieis' | 'baralho_vazio';

export interface GameState {
  jogadores: { P1: PlayerState; P2: PlayerState };
  turnoDe: PlayerId;
  fase: Fase;
  numeroTurno: number;
  vencedor: PlayerId | null;
  motivoVitoria?: MotivoVitoria;
  log: LogEntry[];
  seed: string;
  pendingHandoff: boolean;
}

export type Action =
  | { type: 'AURORA_DRAW' }
  | { type: 'PLAY_BASIC'; cardIdx: number; slot: 'emConfronto' | 'companhia' }
  | { type: 'PROMOTE'; targetIid: InstanceId; cardIdx: number }
  | { type: 'ATTACH_ENERGY'; targetIid: InstanceId; cardIdx: number }
  | { type: 'PLAY_EVENT'; cardIdx: number; alvoIid?: InstanceId }
  | { type: 'PLAY_STRUCTURE'; cardIdx: number }
  | { type: 'RETIRE'; novoIid: InstanceId }
  | { type: 'ATTACK'; ataqueIdx: number }
  | { type: 'END_TURN' }
  | { type: 'COMPLETE_HANDOFF' };
