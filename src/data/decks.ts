import { getCard } from './cards';
import type { CardDef, Faccao } from '../engine/types';

interface DeckRecipe {
  faccaoPrimaria: Faccao;
  cartas: Array<{ id: string; qty: number }>;
}

const APOSTOLOS_RECIPE: DeckRecipe = {
  faccaoPrimaria: 'Apostolos',
  cartas: [
    { id: 'simao_pescador',           qty: 4 },
    { id: 'pedro_apostolo',           qty: 2 },
    { id: 'david_pastor',             qty: 4 },
    { id: 'david_rei',                qty: 2 },
    { id: 'oracao',                   qty: 4 },
    { id: 'traducao_novo_mundo_ptpt', qty: 1 },
    { id: 'energia_generica',         qty: 23 },
    { id: 'energia_pregacao',         qty: 20 },
  ],
};

const FILISTEUS_RECIPE: DeckRecipe = {
  faccaoPrimaria: 'Filisteus',
  cartas: [
    { id: 'golias_de_gate',   qty: 4 },
    { id: 'soldado_filisteu', qty: 12 },
    { id: 'energia_generica', qty: 24 },
    { id: 'energia_dominio',  qty: 20 },
  ],
};

function expand(recipe: DeckRecipe): { faccaoPrimaria: Faccao; cartas: CardDef[] } {
  const cartas: CardDef[] = [];
  for (const entry of recipe.cartas) {
    for (let i = 0; i < entry.qty; i++) {
      cartas.push(getCard(entry.id));
    }
  }
  if (cartas.length !== 60) {
    throw new Error(`Baralho ${recipe.faccaoPrimaria} tem ${cartas.length} cartas, esperado 60.`);
  }
  return { faccaoPrimaria: recipe.faccaoPrimaria, cartas };
}

export const DECKS = {
  apostolos: () => expand(APOSTOLOS_RECIPE),
  filisteus: () => expand(FILISTEUS_RECIPE),
} as const;
