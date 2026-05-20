// Motor puro do TCG Biblico. Funcoes puras, sem efeitos colaterais.
// applyAction(state, action) -> novo state.

import type {
  Action,
  Attack,
  CardDef,
  CardInstance,
  EnergyType,
  Faccao,
  GameState,
  InstanceId,
  PlayerId,
  PlayerState,
} from './types';
import { getCard } from '../data/cards';

// ====================== UTILIDADES PURAS ======================

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToInt(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  const rng = mulberry32(seedToInt(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let _idCounter = 0;
export function newIid(): InstanceId { return `i${(++_idCounter).toString(36)}`; }
export function resetIidCounter(): void { _idCounter = 0; }

const opp = (p: PlayerId): PlayerId => (p === 'P1' ? 'P2' : 'P1');

function log(state: GameState, jogador: PlayerId, texto: string): GameState {
  return { ...state, log: [...state.log, { turno: state.numeroTurno, jogador, texto }] };
}

const energiaIdFor = (e: EnergyType): string =>
  e === 'Pregacao' ? 'energia_pregacao'
  : e === 'Dominio' ? 'energia_dominio'
  : 'energia_generica';

// ====================== SETUP ======================

function makeInstance(def: CardDef, turnoAtual: number): CardInstance {
  return {
    iid: newIid(),
    defId: def.id,
    hpMaximoBonus: 0,
    hpRestante: def.hp ?? 0,
    energiasAnexadas: [],
    estados: [],
    turnoEntrouEmJogo: turnoAtual,
    contadores: {},
    jaAtacouEsteTurno: false,
    evolucoes: [def.id],
  };
}

function temBasicoNaMao(mao: CardDef[]): boolean {
  return mao.some((c) => (c.tipo === 'Fiel' || c.tipo === 'Adversario') && !c.evolucaoDe);
}

function setupPlayer(
  id: PlayerId,
  faccao: Faccao,
  baralhoInicial: CardDef[],
  seed: string,
): PlayerState {
  let baralho = shuffle(baralhoInicial, seed + ':' + id);
  let mao: CardDef[] = baralho.slice(0, 7);
  baralho = baralho.slice(7);
  let tries = 0;
  while (!temBasicoNaMao(mao) && tries < 5) {
    baralho = shuffle([...baralho, ...mao], seed + ':' + id + ':m' + tries);
    mao = baralho.slice(0, 7);
    baralho = baralho.slice(7);
    tries++;
  }
  const talentos = baralho.slice(0, 6);
  baralho = baralho.slice(6);
  return {
    id,
    faccaoPrimaria: faccao,
    baralho,
    mao,
    emConfronto: null,
    companhia: [],
    talentos,
    talentosColhidos: [],
    repouso: [],
    estruturas: [],
    energiaAnexadaEsteTurno: false,
    apoioJogadoEsteTurno: false,
  };
}

export function createInitialState(
  baralhoP1: { faccaoPrimaria: Faccao; cartas: CardDef[] },
  baralhoP2: { faccaoPrimaria: Faccao; cartas: CardDef[] },
  seed = 'sementinha',
): GameState {
  resetIidCounter();
  const state: GameState = {
    jogadores: {
      P1: setupPlayer('P1', baralhoP1.faccaoPrimaria, baralhoP1.cartas, seed),
      P2: setupPlayer('P2', baralhoP2.faccaoPrimaria, baralhoP2.cartas, seed),
    },
    turnoDe: 'P1',
    fase: 'aurora',
    numeroTurno: 1,
    vencedor: null,
    log: [],
    seed,
    pendingHandoff: false,
  };
  return log(state, 'P1', 'Partida iniciada. Vez de P1.');
}

// ====================== HELPERS DE ZONAS ======================

function findInstance(p: PlayerState, iid: InstanceId): CardInstance | null {
  if (p.emConfronto?.iid === iid) return p.emConfronto;
  return p.companhia.find((c) => c.iid === iid) ?? null;
}

function replaceInstance(p: PlayerState, novo: CardInstance): PlayerState {
  if (p.emConfronto?.iid === novo.iid) return { ...p, emConfronto: novo };
  return { ...p, companhia: p.companhia.map((c) => (c.iid === novo.iid ? novo : c)) };
}

function hpMaximoDe(state: GameState, controlador: PlayerId, inst: CardInstance): number {
  const def = getCard(inst.defId);
  let base = def.hp ?? 0;
  base += inst.hpMaximoBonus;
  const player = state.jogadores[controlador];
  if (player.estruturas.some((e) => e.defId === 'traducao_novo_mundo_ptpt')) base += 10;
  return base;
}

// ====================== VITORIA ======================

function checkWin(state: GameState): GameState {
  if (state.vencedor) return state;
  for (const pid of ['P1', 'P2'] as PlayerId[]) {
    const p = state.jogadores[pid];
    if (p.talentosColhidos.length >= 6) {
      return {
        ...log(state, pid, `${pid} colheu 6 Talentos. Vitoria!`),
        vencedor: pid, motivoVitoria: 'talentos', fase: 'fim',
      };
    }
  }
  return state;
}

// ====================== EFEITOS DE ATAQUE ======================

interface EffectCtx {
  state: GameState;
  attackerPid: PlayerId;
  attackerInst: CardInstance;
  defenderPid: PlayerId;
  defenderInst: CardInstance;
  ataque: Attack;
}

type AttackEffect = (ctx: EffectCtx) => { state: GameState; danoSubstituto?: number };

const ATTACK_EFFECTS: Record<string, AttackEffect> = {
  'david-funda': (ctx) => {
    const defDef = getCard(ctx.defenderInst.defId);
    const ehGigante = defDef.tags.includes('Gigante');
    const hpMax = hpMaximoDe(ctx.state, ctx.defenderPid, ctx.defenderInst);
    if (ehGigante || hpMax >= 100) {
      return { state: log(ctx.state, ctx.attackerPid, 'Funda acerta em cheio! (80 dano)'), danoSubstituto: 80 };
    }
    return { state: ctx.state };
  },
  'golias-desafio': (ctx) => {
    let p = ctx.state.jogadores[ctx.defenderPid];
    const intimidate = (inst: CardInstance | null): CardInstance | null => {
      if (!inst) return inst;
      if (inst.hpRestante <= 50 && !inst.estados.includes('paralisado')) {
        return { ...inst, estados: [...inst.estados, 'paralisado'] };
      }
      return inst;
    };
    p = {
      ...p,
      emConfronto: intimidate(p.emConfronto),
      companhia: p.companhia.map((i) => intimidate(i) as CardInstance),
    };
    const s2 = { ...ctx.state, jogadores: { ...ctx.state.jogadores, [ctx.defenderPid]: p } };
    return { state: log(s2, ctx.attackerPid, 'Golias intimida os fracos (paralisados).') };
  },
};

// ====================== PASSIVOS ======================

function processarPassivos(state: GameState, pid: PlayerId): GameState {
  let s = state;
  const p = s.jogadores[pid];
  const processInstance = (inst: CardInstance): CardInstance => {
    const def = getCard(inst.defId);
    if (def.efeitoPassivoId === 'pedro-galo') {
      const turnosPassados = Math.floor((s.numeroTurno - inst.turnoEntrouEmJogo) / 2);
      const jaAconteceu = inst.contadores['galo'] === 1;
      if (turnosPassados >= 3 && !jaAconteceu) {
        const novoHp = Math.max(0, inst.hpRestante - 30);
        s = log(s, pid, 'Pedro lembra-se do galo... (-30 HP, envergonhado)');
        return {
          ...inst,
          hpRestante: novoHp,
          estados: [...inst.estados, 'envergonhado'],
          contadores: { ...inst.contadores, galo: 1 },
        };
      }
      if (jaAconteceu && inst.contadores['galo_recuperou'] !== 1) {
        s = log(s, pid, 'Pedro arrepende-se: +20 HP max.');
        return {
          ...inst,
          hpMaximoBonus: inst.hpMaximoBonus + 20,
          hpRestante: inst.hpRestante + 20,
          estados: inst.estados.filter((e) => e !== 'envergonhado'),
          contadores: { ...inst.contadores, galo_recuperou: 1 },
        };
      }
    }
    return inst;
  };
  const np: PlayerState = {
    ...p,
    emConfronto: p.emConfronto ? processInstance(p.emConfronto) : null,
    companhia: p.companhia.map(processInstance),
  };
  return { ...s, jogadores: { ...s.jogadores, [pid]: np } };
}

// ====================== CUSTO DE ENERGIA ======================

export function podePagarCusto(disponivel: EnergyType[], custo: EnergyType[]): boolean {
  const restante = [...disponivel];
  const especificos = custo.filter((e) => e !== 'Generica');
  const genericos = custo.filter((e) => e === 'Generica').length;
  for (const e of especificos) {
    const idx = restante.indexOf(e);
    if (idx === -1) {
      // tentar pagar com Generica disponivel? Especificos sao especificos.
      // Mas no MVP, permite usar Generica como fallback para especificos.
      const gen = restante.indexOf('Generica');
      if (gen === -1) return false;
      restante.splice(gen, 1);
    } else {
      restante.splice(idx, 1);
    }
  }
  return restante.length >= genericos;
}

// ====================== APLICAR DANO ======================

function aplicarDano(
  state: GameState,
  defenderPid: PlayerId,
  defenderInst: CardInstance,
  dano: number,
  attackerFaccao?: Faccao,
): GameState {
  let danoFinal = dano;
  const defDef = getCard(defenderInst.defId);
  if (attackerFaccao && defDef.fraqueza?.faccao === attackerFaccao) {
    danoFinal = defDef.fraqueza.mod === 'x2' ? danoFinal * 2 : danoFinal + 20;
  }
  if (attackerFaccao && defDef.resistencia?.faccao === attackerFaccao) {
    danoFinal = Math.max(0, danoFinal - 20);
  }
  const novoHp = defenderInst.hpRestante - danoFinal;
  let s = log(state, defenderPid, `${defDef.nome} leva ${danoFinal} de dano.`);
  if (novoHp <= 0) {
    const dp = s.jogadores[defenderPid];
    const ataquePid = opp(defenderPid);
    const energiaDefs: CardDef[] = defenderInst.energiasAnexadas.map((e) => getCard(energiaIdFor(e)));
    const dpAtualizado: PlayerState = {
      ...dp,
      emConfronto: dp.emConfronto?.iid === defenderInst.iid ? null : dp.emConfronto,
      companhia: dp.companhia.filter((c) => c.iid !== defenderInst.iid),
      repouso: [...dp.repouso, defDef, ...energiaDefs],
    };
    const ap = s.jogadores[ataquePid];
    let apAtualizado = ap;
    if (ap.talentos.length > 0) {
      const colhido = ap.talentos[0];
      apAtualizado = {
        ...ap,
        talentos: ap.talentos.slice(1),
        talentosColhidos: [...ap.talentosColhidos, colhido],
        mao: [...ap.mao, colhido],
      };
    }
    s = log(s, ataquePid, `${defDef.nome} foi destruido. ${ataquePid} colhe 1 Talento.`);
    s = {
      ...s,
      jogadores: { ...s.jogadores, [defenderPid]: dpAtualizado, [ataquePid]: apAtualizado },
    };
    s = checkWin(s);
    return s;
  }
  const inst2 = { ...defenderInst, hpRestante: novoHp };
  return {
    ...s,
    jogadores: { ...s.jogadores, [defenderPid]: replaceInstance(s.jogadores[defenderPid], inst2) },
  };
}

// ====================== REDUCER ======================

function endTurn(s: GameState): GameState {
  const next = opp(s.turnoDe);
  let s2: GameState = {
    ...s,
    turnoDe: next,
    fase: 'aurora',
    numeroTurno: s.numeroTurno + 1,
    pendingHandoff: true,
  };
  s2 = log(s2, next, `--- Vez de ${next} (turno ${s2.numeroTurno}) ---`);
  return s2;
}

// ====================== VALIDACAO (mensagens didacticas) ======================

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const MSG_AURORA =
  'Primeiro tens de comprar a carta do turno. Clica no botao "Comprar carta" (fase Aurora).';

// Verifica se uma accao e legal e, se nao for, devolve uma explicacao em linguagem simples.
export function validateAction(state: GameState, action: Action): ValidationResult {
  if (state.vencedor) return { ok: false, reason: 'A partida ja terminou.' };
  const pid = state.turnoDe;
  const me = state.jogadores[pid];

  switch (action.type) {
    case 'COMPLETE_HANDOFF':
      return { ok: true };

    case 'AURORA_DRAW':
      if (state.fase !== 'aurora')
        return { ok: false, reason: 'Ja compraste a carta deste turno. Agora joga as tuas cartas.' };
      return { ok: true };

    case 'END_TURN':
      return { ok: true };

    case 'PLAY_BASIC': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      const carta = me.mao[action.cardIdx];
      if (!carta) return { ok: false, reason: 'Essa carta ja nao esta na tua mao.' };
      if (carta.tipo === 'Energia')
        return { ok: false, reason: `"${carta.nome}" e uma Energia. Liga-a a um Fiel teu, nao a um espaco vazio.` };
      if (carta.tipo === 'Evento' || carta.tipo === 'Estrutura')
        return { ok: false, reason: `"${carta.nome}" nao e um Fiel — nao pode ir para o campo de batalha.` };
      if (carta.evolucaoDe)
        return { ok: false, reason: `"${carta.nome}" e uma Promocao. Primeiro joga o Fiel Basico, depois promove-o.` };
      if (action.slot === 'emConfronto' && me.emConfronto)
        return { ok: false, reason: 'Ja tens um Fiel Em Confronto. Coloca este na Companhia (reserva).' };
      if (action.slot === 'companhia' && me.companhia.length >= 5)
        return { ok: false, reason: 'A Companhia esta cheia (maximo 5 Fieis).' };
      return { ok: true };
    }

    case 'PROMOTE': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      const promo = me.mao[action.cardIdx];
      if (!promo) return { ok: false, reason: 'Essa carta ja nao esta na tua mao.' };
      if (!promo.evolucaoDe)
        return { ok: false, reason: `"${promo.nome}" nao e uma carta de Promocao.` };
      const alvo = findInstance(me, action.targetIid);
      if (!alvo) return { ok: false, reason: 'Escolhe um Fiel teu para promover.' };
      const ultimoDef = alvo.evolucoes[alvo.evolucoes.length - 1];
      if (ultimoDef !== promo.evolucaoDe) {
        const base = getCard(promo.evolucaoDe);
        return { ok: false, reason: `"${promo.nome}" so promove "${base.nome}".` };
      }
      if (alvo.turnoEntrouEmJogo >= state.numeroTurno)
        return { ok: false, reason: 'Esse Fiel entrou agora em jogo. So o podes promover no proximo turno.' };
      return { ok: true };
    }

    case 'ATTACH_ENERGY': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      if (me.energiaAnexadaEsteTurno)
        return { ok: false, reason: 'Ja ligaste uma Energia este turno (limite: 1 por turno).' };
      const carta = me.mao[action.cardIdx];
      if (!carta) return { ok: false, reason: 'Essa carta ja nao esta na tua mao.' };
      if (carta.tipo !== 'Energia')
        return { ok: false, reason: `"${carta.nome}" nao e uma carta de Energia.` };
      const alvo = findInstance(me, action.targetIid);
      if (!alvo) return { ok: false, reason: 'Escolhe um Fiel teu para receber a Energia.' };
      return { ok: true };
    }

    case 'PLAY_EVENT': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      const carta = me.mao[action.cardIdx];
      if (!carta) return { ok: false, reason: 'Essa carta ja nao esta na tua mao.' };
      if (carta.tipo !== 'Evento')
        return { ok: false, reason: `"${carta.nome}" nao e um Evento.` };
      if (carta.subtipo === 'Apoio' && me.apoioJogadoEsteTurno)
        return { ok: false, reason: 'Ja jogaste um Apoio este turno (limite: 1 por turno).' };
      if (carta.id === 'oracao' && !action.alvoIid)
        return { ok: false, reason: 'Escolhe o Fiel teu que queres curar.' };
      return { ok: true };
    }

    case 'PLAY_STRUCTURE': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      const carta = me.mao[action.cardIdx];
      if (!carta) return { ok: false, reason: 'Essa carta ja nao esta na tua mao.' };
      if (carta.tipo !== 'Estrutura')
        return { ok: false, reason: `"${carta.nome}" nao e uma Estrutura.` };
      return { ok: true };
    }

    case 'RETIRE': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      if (!me.emConfronto)
        return { ok: false, reason: 'Nao tens nenhum Fiel Em Confronto para retirar.' };
      const novo = me.companhia.find((c) => c.iid === action.novoIid);
      if (!novo) return { ok: false, reason: 'Escolhe um Fiel da Companhia para entrar no lugar.' };
      const def = getCard(me.emConfronto.defId);
      const custo = def.retirada ?? 0;
      if (me.emConfronto.energiasAnexadas.length < custo)
        return { ok: false, reason: `Falta Energia para retirar "${def.nome}" (custo de retirada: ${custo}).` };
      return { ok: true };
    }

    case 'ATTACK': {
      if (state.fase !== 'acao') return { ok: false, reason: MSG_AURORA };
      if (!me.emConfronto)
        return { ok: false, reason: 'Nao tens nenhum Fiel Em Confronto para atacar.' };
      if (me.emConfronto.estados.includes('paralisado'))
        return { ok: false, reason: 'O teu Fiel esta paralisado e nao pode atacar este turno.' };
      if (me.emConfronto.estados.includes('envergonhado'))
        return { ok: false, reason: 'O teu Fiel esta envergonhado e nao pode atacar este turno.' };
      const def = getCard(me.emConfronto.defId);
      const ataque = def.ataques?.[action.ataqueIdx];
      if (!ataque) return { ok: false, reason: 'Esse ataque nao existe.' };
      if (!podePagarCusto(me.emConfronto.energiasAnexadas, ataque.custo))
        return { ok: false, reason: `Falta Energia para "${ataque.nome}". Liga mais Energia ao teu Fiel primeiro.` };
      const adv = state.jogadores[opp(pid)];
      if (!adv.emConfronto)
        return { ok: false, reason: 'O adversario nao tem Fiel Em Confronto para atacares.' };
      return { ok: true };
    }
  }
  return { ok: true };
}

export function applyAction(state: GameState, action: Action): GameState {
  if (state.vencedor) return state;
  const pid = state.turnoDe;
  let s = state;

  switch (action.type) {

    case 'COMPLETE_HANDOFF':
      return { ...s, pendingHandoff: false };

    case 'AURORA_DRAW': {
      if (s.fase !== 'aurora') return s;
      const me = s.jogadores[pid];
      if (me.baralho.length === 0) {
        const winner = opp(pid);
        return {
          ...log(s, winner, `${pid} nao consegue comprar. ${winner} vence!`),
          vencedor: winner, motivoVitoria: 'baralho_vazio', fase: 'fim',
        };
      }
      if (s.numeroTurno > 1 && !me.emConfronto && me.companhia.length === 0) {
        const winner = opp(pid);
        return {
          ...log(s, winner, `${pid} sem Fieis em jogo. ${winner} vence!`),
          vencedor: winner, motivoVitoria: 'sem_fieis', fase: 'fim',
        };
      }
      const drawn = me.baralho[0];
      const novoMe: PlayerState = {
        ...me,
        mao: [...me.mao, drawn],
        baralho: me.baralho.slice(1),
        energiaAnexadaEsteTurno: false,
        apoioJogadoEsteTurno: false,
      };
      const resetInst = (i: CardInstance | null): CardInstance | null =>
        i ? { ...i, jaAtacouEsteTurno: false } : null;
      novoMe.emConfronto = resetInst(novoMe.emConfronto);
      novoMe.companhia = novoMe.companhia.map((i) => resetInst(i)!);
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe }, fase: 'acao' };
      s = log(s, pid, `Aurora: compra ${drawn.nome}.`);
      s = processarPassivos(s, pid);
      return s;
    }

    case 'PLAY_BASIC': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      const carta = me.mao[action.cardIdx];
      if (!carta || (carta.tipo !== 'Fiel' && carta.tipo !== 'Adversario')) return s;
      if (carta.evolucaoDe) return s;
      const novaInst = makeInstance(carta, s.numeroTurno);
      const novaMao = me.mao.filter((_, i) => i !== action.cardIdx);
      let novoMe = { ...me, mao: novaMao };
      if (action.slot === 'emConfronto') {
        if (novoMe.emConfronto) return s;
        novoMe = { ...novoMe, emConfronto: novaInst };
      } else {
        if (novoMe.companhia.length >= 5) return s;
        novoMe = { ...novoMe, companhia: [...novoMe.companhia, novaInst] };
      }
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
      return log(s, pid, `Joga ${carta.nome} para ${action.slot === 'emConfronto' ? 'Em Confronto' : 'Companhia'}.`);
    }

    case 'PROMOTE': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      const promo = me.mao[action.cardIdx];
      if (!promo || !promo.evolucaoDe) return s;
      const alvo = findInstance(me, action.targetIid);
      if (!alvo) return s;
      const ultimoDef = alvo.evolucoes[alvo.evolucoes.length - 1];
      if (ultimoDef !== promo.evolucaoDe) return s;
      if (alvo.turnoEntrouEmJogo >= s.numeroTurno) return s;
      const oldDef = getCard(ultimoDef);
      const danoAcumulado = (oldDef.hp ?? 0) - alvo.hpRestante;
      const novoHp = Math.max(1, (promo.hp ?? 0) - danoAcumulado);
      const novaInst: CardInstance = {
        ...alvo,
        defId: promo.id,
        hpRestante: novoHp,
        evolucoes: [...alvo.evolucoes, promo.id],
        estados: [],
        contadores: {},
      };
      const novoMe: PlayerState = {
        ...me,
        mao: me.mao.filter((_, i) => i !== action.cardIdx),
        emConfronto: me.emConfronto?.iid === alvo.iid ? novaInst : me.emConfronto,
        companhia: me.companhia.map((c) => (c.iid === alvo.iid ? novaInst : c)),
        repouso: [...me.repouso, oldDef],
      };
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
      return log(s, pid, `Promove ${oldDef.nome} -> ${promo.nome}.`);
    }

    case 'ATTACH_ENERGY': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      if (me.energiaAnexadaEsteTurno) return s;
      const carta = me.mao[action.cardIdx];
      if (!carta || carta.tipo !== 'Energia' || !carta.fornecesEnergia) return s;
      const alvo = findInstance(me, action.targetIid);
      if (!alvo) return s;
      const novaInst: CardInstance = {
        ...alvo,
        energiasAnexadas: [...alvo.energiasAnexadas, carta.fornecesEnergia],
      };
      const novoMe: PlayerState = {
        ...replaceInstance(me, novaInst),
        mao: me.mao.filter((_, i) => i !== action.cardIdx),
        energiaAnexadaEsteTurno: true,
      };
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
      return log(s, pid, `Anexa ${carta.fornecesEnergia} a ${getCard(alvo.defId).nome}.`);
    }

    case 'PLAY_EVENT': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      const carta = me.mao[action.cardIdx];
      if (!carta || carta.tipo !== 'Evento') return s;
      if (carta.subtipo === 'Apoio' && me.apoioJogadoEsteTurno) return s;
      let novoMe: PlayerState = {
        ...me,
        mao: me.mao.filter((_, i) => i !== action.cardIdx),
        repouso: [...me.repouso, carta],
        apoioJogadoEsteTurno: carta.subtipo === 'Apoio' ? true : me.apoioJogadoEsteTurno,
      };
      if (carta.id === 'oracao') {
        if (!action.alvoIid) return s;
        const alvo = findInstance(novoMe, action.alvoIid);
        if (!alvo) return s;
        const def = getCard(alvo.defId);
        const hpMax = hpMaximoDe(s, pid, alvo);
        const novoHp = Math.min(hpMax, alvo.hpRestante + 30);
        novoMe = replaceInstance(novoMe, { ...alvo, hpRestante: novoHp });
        s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
        s = log(s, pid, `Oracao cura ${def.nome} (+${novoHp - alvo.hpRestante} HP).`);
        if ((def.tags.includes('Apostolo') || def.tags.includes('Profeta')) && novoMe.baralho.length > 0) {
          const drawn = novoMe.baralho[0];
          const me2: PlayerState = { ...novoMe, mao: [...novoMe.mao, drawn], baralho: novoMe.baralho.slice(1) };
          s = { ...s, jogadores: { ...s.jogadores, [pid]: me2 } };
          s = log(s, pid, `Apostolo/Profeta — compra extra (${drawn.nome}).`);
        }
        return s;
      }
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
      return log(s, pid, `Joga evento ${carta.nome}.`);
    }

    case 'PLAY_STRUCTURE': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      const carta = me.mao[action.cardIdx];
      if (!carta || carta.tipo !== 'Estrutura') return s;
      const novaInst = makeInstance(carta, s.numeroTurno);
      const novoMe: PlayerState = {
        ...me,
        mao: me.mao.filter((_, i) => i !== action.cardIdx),
        estruturas: [...me.estruturas, novaInst],
      };
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
      return log(s, pid, `Coloca em jogo: ${carta.nome}.`);
    }

    case 'RETIRE': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      if (!me.emConfronto) return s;
      const novoFront = me.companhia.find((c) => c.iid === action.novoIid);
      if (!novoFront) return s;
      const def = getCard(me.emConfronto.defId);
      const custo = def.retirada ?? 0;
      if (me.emConfronto.energiasAnexadas.length < custo) return s;
      const restante = me.emConfronto.energiasAnexadas.slice(custo);
      const exFront: CardInstance = { ...me.emConfronto, energiasAnexadas: restante };
      const novoMe: PlayerState = {
        ...me,
        emConfronto: novoFront,
        companhia: [...me.companhia.filter((c) => c.iid !== novoFront.iid), exFront],
      };
      s = { ...s, jogadores: { ...s.jogadores, [pid]: novoMe } };
      return log(s, pid, `Retira ${def.nome} para a Companhia.`);
    }

    case 'ATTACK': {
      if (s.fase !== 'acao') return s;
      const me = s.jogadores[pid];
      if (!me.emConfronto) return s;
      if (me.emConfronto.estados.includes('paralisado') || me.emConfronto.estados.includes('envergonhado')) {
        return log(s, pid, 'Nao pode atacar (paralisado/envergonhado).');
      }
      const def = getCard(me.emConfronto.defId);
      const ataque = def.ataques?.[action.ataqueIdx];
      if (!ataque) return s;
      if (!podePagarCusto(me.emConfronto.energiasAnexadas, ataque.custo)) {
        return log(s, pid, `Energia insuficiente para ${ataque.nome}.`);
      }
      const adv = s.jogadores[opp(pid)];
      if (!adv.emConfronto) return log(s, pid, 'Sem alvo no Em Confronto adversario.');

      let danoFinal = ataque.dano;
      if (ataque.efeitoId && ATTACK_EFFECTS[ataque.efeitoId]) {
        const ctx: EffectCtx = {
          state: s,
          attackerPid: pid,
          attackerInst: me.emConfronto,
          defenderPid: opp(pid),
          defenderInst: adv.emConfronto,
          ataque,
        };
        const out = ATTACK_EFFECTS[ataque.efeitoId](ctx);
        s = out.state;
        if (typeof out.danoSubstituto === 'number') danoFinal = out.danoSubstituto;
      }
      s = log(s, pid, `${def.nome} usa ${ataque.nome}.`);
      const advAtualizado = s.jogadores[opp(pid)].emConfronto;
      if (!advAtualizado) return s;
      s = aplicarDano(s, opp(pid), advAtualizado, danoFinal, def.faccao);
      if (s.vencedor) return s;

      const me2 = s.jogadores[pid];
      if (me2.emConfronto) {
        s = {
          ...s,
          jogadores: { ...s.jogadores, [pid]: { ...me2, emConfronto: { ...me2.emConfronto, jaAtacouEsteTurno: true } } },
        };
      }
      return endTurn(s);
    }

    case 'END_TURN':
      return endTurn(s);
  }
  return s;
}
