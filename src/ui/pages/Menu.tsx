import { useGameStore } from '../../store/game-store';
import { CardBack } from '../components/Card';

export default function Menu() {
  const startGame = useGameStore((s) => s.startGame);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 bg-gradient-to-b from-stone-50 to-stone-200">
      <div className="max-w-3xl text-center">
        <div className="flex justify-center mb-10">
          <div className="w-48 h-72 shadow-2xl rounded-md overflow-hidden">
            <CardBack />
          </div>
        </div>
        <h1 className="text-5xl font-serif font-bold text-stone-900 mb-3 tracking-tight">
          TCG Bíblico
        </h1>
        <p className="text-stone-600 mb-2 text-lg">
          Trading card game digital com tema bíblico.
        </p>
        <p className="text-stone-500 text-sm mb-12 italic max-w-xl mx-auto">
          MVP hot-seat — dois jogadores partilham o mesmo browser e passam a vez à vez.
          O nome de Jeová aparece nas costas das cartas em hebraico (יהוה),
          conforme aparece milhares de vezes nas Escrituras.
        </p>
        <button
          onClick={() => startGame()}
          className="px-10 py-4 bg-stone-900 text-stone-50 font-serif text-lg rounded-md
                     shadow-lg hover:bg-stone-800 hover:shadow-xl transition-all
                     border border-amber-700/40"
        >
          Iniciar partida (Apóstolos vs Filisteus)
        </button>
        <p className="text-xs text-stone-400 mt-6">
          P1: Apóstolos · P2: Filisteus · matchup temático David vs Golias
        </p>
      </div>
    </div>
  );
}
