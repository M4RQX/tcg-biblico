import { create } from 'zustand';
import type { Action, GameState } from '../engine/types';
import { applyAction, createInitialState } from '../engine/engine';
import { DECKS } from '../data/decks';

interface GameStoreState {
  state: GameState | null;
  // UI ephemeral selection
  selectedHandIdx: number | null;
  selectedAttackIdx: number | null;
  startGame: (seed?: string) => void;
  dispatch: (a: Action) => void;
  reset: () => void;
  selectHandCard: (idx: number | null) => void;
  selectAttack: (idx: number | null) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: null,
  selectedHandIdx: null,
  selectedAttackIdx: null,
  startGame: (seed) => {
    const s = createInitialState(
      DECKS.apostolos(),
      DECKS.filisteus(),
      seed ?? `s-${Date.now()}`,
    );
    set({ state: s, selectedHandIdx: null, selectedAttackIdx: null });
  },
  dispatch: (a) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: applyAction(cur, a), selectedHandIdx: null, selectedAttackIdx: null });
  },
  reset: () => set({ state: null, selectedHandIdx: null, selectedAttackIdx: null }),
  selectHandCard: (idx) => set({ selectedHandIdx: idx, selectedAttackIdx: null }),
  selectAttack: (idx) => set({ selectedAttackIdx: idx, selectedHandIdx: null }),
}));
