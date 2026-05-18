import { describe, it, expect } from 'vitest';
import { createInitialState, applyAction, newIid, resetIidCounter } from '../engine';
import type { GameState, CardDef, Faccao } from '../types';
import { getCard } from '../../data/cards';
import { DECKS } from '../../data/decks';

function makeStateWithFront(
  p1Front: string,
  p1Energy: number,
  p2Front: string,
  p2Energy: number,
): GameState {
  resetIidCounter();
  const baseDeck = (faccao: Faccao, cardId: string): { faccaoPrimaria: Faccao; cartas: CardDef[] } => {
    const cartas: CardDef[] = [];
    for (let i = 0; i < 4; i++) cartas.push(getCard(cardId));
    for (let i = 0; i < 56; i++) cartas.push(getCard('energia_generica'));
    return { faccaoPrimaria: faccao, cartas };
  };
  const s = createInitialState(baseDeck('Apostolos', p1Front), baseDeck('Filisteus', p2Front), 'test-seed');
  const p1Def = getCard(p1Front);
  const p2Def = getCard(p2Front);
  const energiasP1: any[] = Array(p1Energy).fill('Generica');
  const energiasP2: any[] = Array(p2Energy).fill('Generica');
  return {
    ...s,
    fase: 'acao',
    jogadores: {
      ...s.jogadores,
      P1: {
        ...s.jogadores.P1,
        emConfronto: {
          iid: newIid(), defId: p1Front, hpMaximoBonus: 0,
          hpRestante: p1Def.hp ?? 0, energiasAnexadas: energiasP1,
          estados: [], turnoEntrouEmJogo: 0, contadores: {},
          jaAtacouEsteTurno: false, evolucoes: [p1Front],
        },
      },
      P2: {
        ...s.jogadores.P2,
        emConfronto: {
          iid: newIid(), defId: p2Front, hpMaximoBonus: 0,
          hpRestante: p2Def.hp ?? 0, energiasAnexadas: energiasP2,
          estados: [], turnoEntrouEmJogo: 0, contadores: {},
          jaAtacouEsteTurno: false, evolucoes: [p2Front],
        },
      },
    },
  };
}

describe('Setup', () => {
  it('cria estado inicial com mao 7, talentos 6, baralhos validos', () => {
    const s = createInitialState(DECKS.apostolos(), DECKS.filisteus(), 'seed-1');
    expect(s.jogadores.P1.mao.length).toBe(7);
    expect(s.jogadores.P2.mao.length).toBe(7);
    expect(s.jogadores.P1.talentos.length).toBe(6);
    expect(s.jogadores.P2.talentos.length).toBe(6);
    expect(s.jogadores.P1.baralho.length).toBe(60 - 7 - 6);
    expect(s.turnoDe).toBe('P1');
    expect(s.fase).toBe('aurora');
    expect(s.numeroTurno).toBe(1);
  });

  it('mulligan: P1 acaba com pelo menos 1 basico na mao', () => {
    const s = createInitialState(DECKS.apostolos(), DECKS.filisteus(), 'mull-test');
    const temBasico = s.jogadores.P1.mao.some(
      (c) => (c.tipo === 'Fiel' || c.tipo === 'Adversario') && !c.evolucaoDe,
    );
    expect(temBasico).toBe(true);
  });
});

describe('Turn flow', () => {
  it('AURORA_DRAW move fase para acao e adiciona 1 carta a mao', () => {
    const s0 = createInitialState(DECKS.apostolos(), DECKS.filisteus(), 'seed-2');
    const s1 = applyAction(s0, { type: 'AURORA_DRAW' });
    expect(s1.fase).toBe('acao');
    expect(s1.jogadores.P1.mao.length).toBe(8);
  });

  it('END_TURN troca jogador e incrementa turno', () => {
    const s0 = createInitialState(DECKS.apostolos(), DECKS.filisteus(), 'seed-3');
    const s1 = applyAction(s0, { type: 'AURORA_DRAW' });
    const s2 = applyAction(s1, { type: 'END_TURN' });
    expect(s2.turnoDe).toBe('P2');
    expect(s2.numeroTurno).toBe(2);
    expect(s2.fase).toBe('aurora');
    expect(s2.pendingHandoff).toBe(true);
  });
});

describe('Dano + fraqueza', () => {
  it('David Funda vs Golias (Gigante, fraco a Reis x2) destroi Golias', () => {
    const s = makeStateWithFront('david_pastor', 1, 'golias_de_gate', 0);
    const s2 = applyAction(s, { type: 'ATTACK', ataqueIdx: 0 });
    expect(s2.jogadores.P2.emConfronto).toBe(null);
    expect(s2.jogadores.P1.talentosColhidos.length).toBe(1);
  });

  it('David Funda contra alvo nao-gigante de HP < 100 faz so 20 dano', () => {
    const s = makeStateWithFront('david_pastor', 1, 'soldado_filisteu', 0);
    const s2 = applyAction(s, { type: 'ATTACK', ataqueIdx: 0 });
    const soldado = s2.jogadores.P2.emConfronto;
    expect(soldado).not.toBeNull();
    expect(soldado!.hpRestante).toBe(50 - 20);
  });
});

describe('Promocao', () => {
  it('Simao -> Pedro: transfere energia anexada e dano acumulado', () => {
    resetIidCounter();
    let s = createInitialState(DECKS.apostolos(), DECKS.filisteus(), 'promo-seed');
    const pedroDef = getCard('pedro_apostolo');
    s = {
      ...s,
      fase: 'acao',
      jogadores: {
        ...s.jogadores,
        P1: {
          ...s.jogadores.P1,
          mao: [pedroDef, ...s.jogadores.P1.mao],
          emConfronto: {
            iid: newIid(), defId: 'simao_pescador',
            hpMaximoBonus: 0, hpRestante: 30,
            energiasAnexadas: ['Pregacao'],
            estados: [], turnoEntrouEmJogo: 0, contadores: {},
            jaAtacouEsteTurno: false, evolucoes: ['simao_pescador'],
          },
        },
      },
    };
    const iid = s.jogadores.P1.emConfronto!.iid;
    const s2 = applyAction(s, { type: 'PROMOTE', targetIid: iid, cardIdx: 0 });
    const pedro = s2.jogadores.P1.emConfronto!;
    expect(pedro.defId).toBe('pedro_apostolo');
    // dano acumulado: 40-30=10; Pedro novo HP: 100-10 = 90
    expect(pedro.hpRestante).toBe(90);
    expect(pedro.energiasAnexadas).toEqual(['Pregacao']);
  });
});

describe('Vitoria', () => {
  it('colher 6 Talentos termina o jogo', () => {
    resetIidCounter();
    let s = createInitialState(DECKS.apostolos(), DECKS.filisteus(), 'win-seed');
    s = {
      ...s,
      fase: 'acao',
      jogadores: {
        ...s.jogadores,
        P1: {
          ...s.jogadores.P1,
          talentosColhidos: s.jogadores.P1.talentos.slice(0, 5),
          talentos: s.jogadores.P1.talentos.slice(5),
          emConfronto: {
            iid: newIid(), defId: 'david_pastor',
            hpMaximoBonus: 0, hpRestante: 60,
            energiasAnexadas: ['Coragem'],
            estados: [], turnoEntrouEmJogo: 0, contadores: {},
            jaAtacouEsteTurno: false, evolucoes: ['david_pastor'],
          },
        },
        P2: {
          ...s.jogadores.P2,
          emConfronto: {
            iid: newIid(), defId: 'soldado_filisteu',
            hpMaximoBonus: 0, hpRestante: 10,
            energiasAnexadas: [],
            estados: [], turnoEntrouEmJogo: 0, contadores: {},
            jaAtacouEsteTurno: false, evolucoes: ['soldado_filisteu'],
          },
        },
      },
    };
    const s2 = applyAction(s, { type: 'ATTACK', ataqueIdx: 0 });
    expect(s2.vencedor).toBe('P1');
    expect(s2.motivoVitoria).toBe('talentos');
  });
});
