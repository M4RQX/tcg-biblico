import type { CardDef } from '../engine/types';

// MVP: 10 cartas + 3 energias.
export const CARDS: Record<string, CardDef> = {

  // ====================== APOSTOLOS ======================

  simao_pescador: {
    id: 'simao_pescador',
    nome: 'Simao, Pescador',
    tipo: 'Fiel',
    faccao: 'Apostolos',
    tags: ['Apostolo'],
    custoEnergia: 1,
    hp: 40,
    ataques: [
      {
        nome: 'Lancar Rede',
        custo: ['Generica'],
        dano: 10,
        texto: 'Ves a carta do topo do baralho adversario.',
      },
    ],
    retirada: 1,
    flavor: '"Vinde apos mim, e eu vos farei pescadores de homens." — Mateus 4:19',
  },

  pedro_apostolo: {
    id: 'pedro_apostolo',
    nome: 'Pedro, Impetuoso',
    tipo: 'Fiel',
    faccao: 'Apostolos',
    tags: ['Apostolo'],
    custoEnergia: 3,
    hp: 100,
    evolucaoDe: 'simao_pescador',
    ataques: [
      {
        nome: 'Espada Pronta',
        custo: ['Pregacao'],
        dano: 30,
        texto: 'Tambem causa 20 a um Adversario na Companhia. (cortou a orelha de Malco)',
      },
      {
        nome: 'Pregar com Ousadia',
        custo: ['Pregacao', 'Pregacao'],
        dano: 60,
      },
    ],
    retirada: 2,
    efeitoPassivoId: 'pedro-galo',
    efeitoTexto:
      'Galo: no inicio do teu 3o turno apos Pedro entrar em jogo, leva 30 de dano e fica Envergonhado 1 turno. Depois recupera com +20 HP maximo permanente.',
    flavor: '"Ainda que todos tropecem, eu nao." — Marcos 14:29',
  },

  david_pastor: {
    id: 'david_pastor',
    nome: 'David, Pastor de Belem',
    tipo: 'Fiel',
    faccao: 'Reis',
    tags: ['Rei'],
    custoEnergia: 2,
    hp: 60,
    ataques: [
      {
        nome: 'Funda',
        custo: ['Coragem'],
        dano: 20,
        efeitoId: 'david-funda',
        texto: 'Se o alvo tem tag Gigante ou HP >= 100, o dano e 80 em vez de 20.',
      },
    ],
    retirada: 1,
    flavor: '"Tu vens a mim com lanca e escudo, mas eu vou contra ti em nome de Jeova." — 1 Samuel 17:45',
  },

  david_rei: {
    id: 'david_rei',
    nome: 'David, Rei de Israel',
    tipo: 'Fiel',
    faccao: 'Reis',
    tags: ['Rei'],
    custoEnergia: 4,
    hp: 140,
    evolucaoDe: 'david_pastor',
    ataques: [
      {
        nome: 'Salmo de Vitoria',
        custo: ['Coragem'],
        dano: 40,
        texto: 'Procura no teu baralho 1 Fiel Rei e poe-no na Companhia (revela e embaralha).',
      },
      {
        nome: 'Espada do Rei',
        custo: ['Coragem', 'Coragem', 'Generica'],
        dano: 90,
      },
    ],
    retirada: 2,
    flavor: '"Jeova esta comigo entre os que me ajudam." — Salmo 118:7',
  },

  oracao: {
    id: 'oracao',
    nome: 'Oracao Fervorosa',
    tipo: 'Evento',
    subtipo: 'Bencao',
    tags: ['Oracao'],
    custoEnergia: 1,
    efeitoTexto:
      'Cura 30 HP a um Fiel teu. Se o Fiel for Apostolo ou Profeta, compras tambem 1 carta.',
    flavor: '"A suplica do justo tem muita forca." — Tiago 5:16',
  },

  traducao_novo_mundo_ptpt: {
    id: 'traducao_novo_mundo_ptpt',
    nome: 'Traducao do Novo Mundo (Edicao Portugal)',
    tipo: 'Estrutura',
    tags: ['Escritura'],
    custoEnergia: 2,
    efeitoTexto:
      'Os teus Fieis ganham +10 HP maximo. Uma vez por turno, paga 1 Energia para ver as 3 cartas do topo do teu baralho, mete 1 na mao e devolve as outras na ordem que escolheres. Imune a efeitos cujo texto contenha "voce".',
    flavor: 'Vos, sim. Voces? Nao por aqui.',
  },

  // ====================== FILISTEUS ======================

  golias_de_gate: {
    id: 'golias_de_gate',
    nome: 'Golias de Gate',
    tipo: 'Adversario',
    faccao: 'Filisteus',
    tags: ['Gigante'],
    custoEnergia: 5,
    hp: 160,
    ataques: [
      {
        nome: 'Desafio',
        custo: ['Dominio', 'Dominio'],
        dano: 70,
        efeitoId: 'golias-desafio',
        texto: 'Intimidacao: Fieis adversarios com HP <= 50 ganham estado "paralisado" no proximo turno.',
      },
      {
        nome: 'Lanca Pesada',
        custo: ['Dominio', 'Dominio', 'Generica'],
        dano: 100,
      },
    ],
    retirada: 4,
    fraqueza: { faccao: 'Reis', mod: 'x2' },
    flavor: '"Escolhei um homem e que desca contra mim." — 1 Samuel 17:8',
  },

  soldado_filisteu: {
    id: 'soldado_filisteu',
    nome: 'Soldado Filisteu',
    tipo: 'Adversario',
    faccao: 'Filisteus',
    tags: ['Soldado'],
    custoEnergia: 1,
    hp: 50,
    ataques: [
      {
        nome: 'Lanca',
        custo: ['Dominio'],
        dano: 20,
      },
    ],
    retirada: 1,
    flavor: '"E os filisteus juntaram os seus exercitos para a guerra." — 1 Samuel 17:1',
  },

  // ====================== ENERGIAS ======================

  energia_generica: {
    id: 'energia_generica',
    nome: 'Tempo',
    tipo: 'Energia',
    tags: [],
    custoEnergia: 0,
    fornecesEnergia: 'Generica',
    flavor: '"Para tudo ha um tempo determinado." — Eclesiastes 3:1',
  },

  energia_pregacao: {
    id: 'energia_pregacao',
    nome: 'Pregacao',
    tipo: 'Energia',
    tags: [],
    custoEnergia: 0,
    fornecesEnergia: 'Pregacao',
    flavor: '"Ai de mim se nao pregar!" — 1 Corintios 9:16',
  },

  energia_dominio: {
    id: 'energia_dominio',
    nome: 'Dominio',
    tipo: 'Energia',
    tags: [],
    custoEnergia: 0,
    fornecesEnergia: 'Dominio',
    flavor: 'Forca bruta dos sistemas humanos.',
  },
};

export function getCard(id: string): CardDef {
  const c = CARDS[id];
  if (!c) throw new Error(`Carta nao encontrada: ${id}`);
  return c;
}
