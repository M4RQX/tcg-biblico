import { useEffect, useState } from 'react';
import { makeRoomCode, useGameStore } from '../../store/game-store';
import { CardBack } from '../components/Card';

type Screen = 'home' | 'online_options' | 'lobby';

export default function Menu() {
  const startHotseat = useGameStore((s) => s.startHotseat);
  const connectOnline = useGameStore((s) => s.connectOnline);
  const startOnlineGame = useGameStore((s) => s.startOnlineGame);
  const myRole = useGameStore((s) => s.myRole);
  const roomId = useGameStore((s) => s.roomId);
  const connectionError = useGameStore((s) => s.connectionError);
  const presentPlayers = useGameStore((s) => s.presentPlayers);
  const reset = useGameStore((s) => s.reset);

  const [screen, setScreen] = useState<Screen>('home');
  const [codeInput, setCodeInput] = useState('');
  const [joining, setJoining] = useState(false);

  // Carregar sala do URL hash se presente
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toUpperCase();
    if (/^[A-Z]{5}$/.test(hash) && screen === 'home') {
      setCodeInput(hash);
      setScreen('online_options');
    }
  }, [screen]);

  // Quando entras na sala, vai para lobby
  useEffect(() => {
    if (myRole && screen !== 'lobby') setScreen('lobby');
  }, [myRole, screen]);

  const onCreate = async () => {
    const code = makeRoomCode();
    setJoining(true);
    try {
      await connectOnline(code);
      window.location.hash = code;
    } catch {
      /* erro tratado no store */
    } finally {
      setJoining(false);
    }
  };

  const onJoin = async () => {
    const code = codeInput.toUpperCase().trim();
    if (!/^[A-Z]{5}$/.test(code)) return;
    setJoining(true);
    try {
      await connectOnline(code);
      window.location.hash = code;
    } catch {
      /* erro tratado no store */
    } finally {
      setJoining(false);
    }
  };

  if (screen === 'lobby' && myRole) {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${roomId}`;
    const p1 = presentPlayers.find((p) => p.role === 'P1');
    const p2 = presentPlayers.find((p) => p.role === 'P2');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 bg-gradient-to-b from-stone-50 to-stone-200">
        <div className="max-w-xl text-center">
          <div className="flex justify-center mb-8">
            <div className="w-36 h-52 shadow-2xl rounded-md overflow-hidden">
              <CardBack />
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">Sala {roomId}</h2>
          <p className="text-stone-600 mb-8">
            Tu és <span className="font-bold text-amber-700">{myRole}</span>
            {myRole === 'P1' ? ' (Apóstolos)' : myRole === 'P2' ? ' (Filisteus)' : ' (espectador)'}.
          </p>

          <div className="bg-white border border-stone-300 rounded-md p-4 mb-6 text-left">
            <div className="text-xs uppercase tracking-wide text-stone-500 mb-2">Convida o outro jogador</div>
            <code className="block bg-stone-100 p-3 rounded text-sm break-all mb-2">{shareUrl}</code>
            <button
              className="text-xs bg-stone-200 hover:bg-stone-300 px-2 py-1 rounded"
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
            >Copiar link</button>
            <div className="mt-3 text-xs text-stone-600">
              Ou diz-lhe para entrar com o código <span className="font-mono font-bold">{roomId}</span>.
            </div>
          </div>

          <div className="flex justify-center gap-6 mb-6 text-sm">
            <div className={`px-3 py-2 rounded ${p1 ? 'bg-apostolos-50 border border-apostolos-500' : 'bg-stone-100 border border-dashed border-stone-400'}`}>
              <div className="font-bold">P1 — Apóstolos</div>
              <div className="text-xs text-stone-600">{p1 ? '✓ Pronto' : 'A aguardar...'}</div>
            </div>
            <div className={`px-3 py-2 rounded ${p2 ? 'bg-filisteus-50 border border-filisteus-500' : 'bg-stone-100 border border-dashed border-stone-400'}`}>
              <div className="font-bold">P2 — Filisteus</div>
              <div className="text-xs text-stone-600">{p2 ? '✓ Pronto' : 'A aguardar...'}</div>
            </div>
          </div>

          {connectionError && (
            <p className="text-rose-700 text-sm mb-3">{connectionError}</p>
          )}

          {myRole === 'P1' ? (
            <button
              disabled={!p1 || !p2}
              onClick={startOnlineGame}
              className="px-8 py-3 bg-stone-900 disabled:bg-stone-400 text-stone-50 font-serif rounded-md shadow-lg text-lg"
            >
              {p1 && p2 ? 'Iniciar partida' : 'A aguardar segundo jogador...'}
            </button>
          ) : (
            <p className="text-stone-500 italic">À espera que P1 inicie a partida.</p>
          )}

          <button
            className="block mx-auto mt-6 text-xs text-stone-500 hover:underline"
            onClick={() => { reset(); window.location.hash = ''; setScreen('home'); }}
          >Cancelar e voltar ao menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'online_options') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 bg-gradient-to-b from-stone-50 to-stone-200">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-serif mb-8">Jogar online</h2>
          <button
            onClick={onCreate}
            disabled={joining}
            className="w-full px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-stone-50 font-serif rounded-md mb-4 shadow"
          >
            Criar nova sala
          </button>
          <div className="text-stone-500 text-sm my-4">— ou —</div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              maxLength={5}
              placeholder="CÓDIGO"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              className="flex-1 border border-stone-400 rounded-md px-3 py-2 font-mono text-center text-xl tracking-widest"
            />
            <button
              onClick={onJoin}
              disabled={joining || codeInput.length !== 5}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-300 text-stone-50 rounded-md"
            >
              Entrar
            </button>
          </div>
          {connectionError && <p className="text-rose-700 text-sm mt-2">{connectionError}</p>}
          <button
            className="block mx-auto mt-8 text-sm text-stone-500 hover:underline"
            onClick={() => setScreen('home')}
          >← Voltar</button>
        </div>
      </div>
    );
  }

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
          O nome de Jeová aparece nas costas das cartas em hebraico (יהוה),
          conforme aparece milhares de vezes nas Escrituras.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setScreen('online_options')}
            className="px-8 py-4 bg-stone-900 text-stone-50 font-serif text-lg rounded-md
                       shadow-lg hover:bg-stone-800 hover:shadow-xl transition-all
                       border border-amber-700/40"
          >
            Jogar online (com amigo)
          </button>
          <button
            onClick={() => startHotseat()}
            className="px-8 py-4 bg-stone-50 text-stone-900 font-serif text-lg rounded-md
                       shadow hover:bg-white border border-stone-400 transition-all"
          >
            Hot-seat (mesmo browser)
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-6">
          P1: Apóstolos · P2: Filisteus · matchup temático David vs Golias
        </p>
      </div>
    </div>
  );
}
