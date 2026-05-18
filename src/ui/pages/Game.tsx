import { useGameStore } from '../../store/game-store';
import { Card, CardBack } from '../components/Card';
import { getCard } from '../../data/cards';
import type { CardDef, GameState, PlayerId } from '../../engine/types';

// ====================== HANDOFF (hot-seat) ======================
function HandoffOverlay({ proximoJogador }: { proximoJogador: PlayerId }) {
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <div className="fixed inset-0 z-50 bg-mesa flex flex-col items-center justify-center text-stone-100">
      <div className="text-center max-w-md px-8">
        <h2 className="text-4xl font-serif mb-3">Passa o controlador</h2>
        <p className="text-stone-400 mb-2 text-lg">
          A vez é agora de <span className="text-amber-300 font-bold">{proximoJogador}</span>
        </p>
        <p className="text-stone-500 italic mb-10 text-sm">
          Clica para revelar a mão. Não espreites se não fores tu.
        </p>
        <button
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-stone-900 font-serif rounded-md shadow-lg text-lg"
          onClick={() => dispatch({ type: 'COMPLETE_HANDOFF' })}
        >
          Continuar como {proximoJogador}
        </button>
      </div>
    </div>
  );
}

// ====================== FIM ======================
function EndScreen({ state }: { state: GameState }) {
  const reset = useGameStore((s) => s.reset);
  const motivo = state.motivoVitoria === 'talentos' ? '6 Talentos colhidos'
               : state.motivoVitoria === 'sem_fieis' ? 'Adversário sem Fiéis'
               : 'Baralho adversário vazio';
  return (
    <div className="fixed inset-0 z-40 bg-mesa/95 backdrop-blur flex flex-col items-center justify-center text-stone-100">
      <h1 className="text-6xl font-serif mb-2">{state.vencedor} venceu!</h1>
      <p className="text-stone-400 mb-8 text-lg italic">{motivo}</p>
      <button
        className="px-8 py-3 bg-stone-100 text-stone-900 font-serif rounded-md text-lg hover:bg-white shadow-lg"
        onClick={reset}
      >
        Voltar ao menu
      </button>
    </div>
  );
}

// ====================== TALENTOS COMPACTOS ======================
function TalentosBar({ talentos, colhidos }: { talentos: CardDef[]; colhidos: CardDef[] }) {
  const total = talentos.length + colhidos.length;
  return (
    <div className="flex items-center gap-1" title={`Talentos colhidos: ${colhidos.length}/${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-3.5 rounded-sm ${
            i < colhidos.length
              ? 'bg-amber-400 border border-amber-600'
              : 'bg-biblia-capaEscura border border-biblia-borda'
          }`}
        />
      ))}
    </div>
  );
}

// ====================== STATUS BAR (jogador) ======================
function PlayerStatusBar({ pid, isMe, isActive }: { pid: PlayerId; isMe: boolean; isActive: boolean }) {
  const p = useGameStore((s) => s.state!.jogadores[pid]);
  return (
    <div className={`flex items-center justify-between px-4 py-2 text-stone-200
      ${isActive ? 'bg-amber-900/40 border-amber-600/60' : 'bg-mesa-claro/80 border-stone-800'}
      border-b transition-colors`}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className={`font-serif font-bold text-base ${isActive ? 'text-amber-300' : ''}`}>
          {pid}
        </span>
        <span className="text-stone-400">{p.faccaoPrimaria}</span>
        {isMe && <span className="text-[10px] uppercase tracking-wider bg-amber-700 text-amber-50 px-1.5 py-0.5 rounded">tu</span>}
        {isActive && <span className="text-[10px] uppercase tracking-wider bg-amber-500 text-stone-900 px-1.5 py-0.5 rounded animate-pulse">a jogar</span>}
      </div>
      <div className="flex items-center gap-4 text-xs text-stone-400">
        <span title="Talentos">
          <TalentosBar talentos={p.talentos} colhidos={p.talentosColhidos} />
        </span>
        <span><span className="text-stone-500">Mão</span> <span className="text-stone-200 font-semibold">{p.mao.length}</span></span>
        <span><span className="text-stone-500">Baralho</span> <span className="text-stone-200 font-semibold">{p.baralho.length}</span></span>
        <span><span className="text-stone-500">Repouso</span> <span className="text-stone-200 font-semibold">{p.repouso.length}</span></span>
      </div>
    </div>
  );
}

// ====================== INTERACÇÕES ======================
function useSlotClickHandler(pid: PlayerId, isActive: boolean) {
  const dispatch = useGameStore((s) => s.dispatch);
  const selectedHandIdx = useGameStore((s) => s.selectedHandIdx);
  const selectAttack = useGameStore((s) => s.selectAttack);
  const selectedAttackIdx = useGameStore((s) => s.selectedAttackIdx);
  const state = useGameStore((s) => s.state)!;
  const p = state.jogadores[pid];

  return (slot: 'emConfronto' | 'companhia' | 'instance', iid?: string) => {
    if (!isActive) {
      if (selectedAttackIdx !== null && slot === 'instance') {
        dispatch({ type: 'ATTACK', ataqueIdx: selectedAttackIdx });
        selectAttack(null);
      }
      return;
    }
    if (selectedHandIdx !== null) {
      const carta = p.mao[selectedHandIdx];
      if (!carta) return;
      if (carta.tipo === 'Energia' && iid) {
        dispatch({ type: 'ATTACH_ENERGY', targetIid: iid, cardIdx: selectedHandIdx });
      } else if (carta.tipo === 'Estrutura') {
        dispatch({ type: 'PLAY_STRUCTURE', cardIdx: selectedHandIdx });
      } else if (carta.tipo === 'Evento') {
        dispatch({ type: 'PLAY_EVENT', cardIdx: selectedHandIdx, alvoIid: iid });
      } else if ((carta.tipo === 'Fiel' || carta.tipo === 'Adversario') && !carta.evolucaoDe && slot !== 'instance') {
        dispatch({ type: 'PLAY_BASIC', cardIdx: selectedHandIdx, slot });
      } else if (carta.evolucaoDe && iid) {
        dispatch({ type: 'PROMOTE', targetIid: iid, cardIdx: selectedHandIdx });
      }
    }
  };
}

// ====================== COMPANHIA ROW ======================
function CompanhiaRow({ pid, isActive }: { pid: PlayerId; isActive: boolean }) {
  const p = useGameStore((s) => s.state!.jogadores[pid]);
  const selectedHandIdx = useGameStore((s) => s.selectedHandIdx);
  const onSlot = useSlotClickHandler(pid, isActive);

  return (
    <div className="flex justify-center gap-2 py-2 px-4">
      {Array.from({ length: 5 }).map((_, i) => {
        const c = p.companhia[i];
        if (c) {
          return (
            <Card
              key={c.iid}
              def={getCard(c.defId)}
              instance={c}
              size="sm"
              onClick={() => onSlot('instance', c.iid)}
            />
          );
        }
        const dropHint = isActive && selectedHandIdx !== null;
        return (
          <div
            key={`empty${i}`}
            onClick={() => onSlot('companhia')}
            className={`w-28 h-40 rounded-md border-2 border-dashed flex items-center justify-center text-[10px] text-stone-500 transition-colors
              ${dropHint ? 'border-amber-500 bg-amber-50/5 cursor-pointer' : 'border-stone-700/60 bg-mesa-claro/30'}`}
          >
            <span className="opacity-60 uppercase tracking-wider">vazio</span>
          </div>
        );
      })}
    </div>
  );
}

// ====================== BATTLEFIELD (centro) ======================
function Battlefield({
  topPid, bottomPid, isActiveTop, isActiveBottom,
}: {
  topPid: PlayerId; bottomPid: PlayerId;
  isActiveTop: boolean; isActiveBottom: boolean;
}) {
  const state = useGameStore((s) => s.state)!;
  const selectAttack = useGameStore((s) => s.selectAttack);
  const selectedAttackIdx = useGameStore((s) => s.selectedAttackIdx);
  const onSlotTop = useSlotClickHandler(topPid, isActiveTop);
  const onSlotBottom = useSlotClickHandler(bottomPid, isActiveBottom);
  const top = state.jogadores[topPid].emConfronto;
  const bottom = state.jogadores[bottomPid].emConfronto;

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center py-3 px-4 bg-gradient-to-b from-mesa-claro via-mesa to-mesa-claro overflow-hidden">
      {/* Linha central — "horizonte" da mesa */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        <div className="bg-mesa-claro border border-amber-700/40 rounded-full px-3 py-0.5 text-[9px] tracking-[0.3em] uppercase text-amber-200/70 font-serif">
          em confronto
        </div>
      </div>

      {/* Em confronto adversário (em cima) */}
      <div className="flex-1 flex items-end justify-center pb-3">
        {top ? (
          <div className={`transition-transform ${selectedAttackIdx !== null ? 'ring-4 ring-rose-400 ring-offset-2 ring-offset-mesa rounded-md cursor-crosshair animate-pulse' : ''}`}>
            <Card
              def={getCard(top.defId)}
              instance={top}
              size="md"
              onClick={() => onSlotTop('instance', top.iid)}
            />
          </div>
        ) : (
          <EmptyConfrontoSlot pid={topPid} isActive={isActiveTop} />
        )}
      </div>

      {/* Em confronto próprio (em baixo) */}
      <div className="flex-1 flex items-start justify-center pt-3">
        {bottom ? (
          <Card
            def={getCard(bottom.defId)}
            instance={bottom}
            size="md"
            onClick={() => onSlotBottom('instance', bottom.iid)}
            onAttackClick={isActiveBottom ? (i) => selectAttack(i) : undefined}
            selectedAttackIdx={isActiveBottom ? selectedAttackIdx : null}
          />
        ) : (
          <EmptyConfrontoSlot pid={bottomPid} isActive={isActiveBottom} />
        )}
      </div>
    </div>
  );
}

function EmptyConfrontoSlot({ pid, isActive }: { pid: PlayerId; isActive: boolean }) {
  const selectedHandIdx = useGameStore((s) => s.selectedHandIdx);
  const onSlot = useSlotClickHandler(pid, isActive);
  const dropHint = isActive && selectedHandIdx !== null;
  return (
    <div
      onClick={() => onSlot('emConfronto')}
      className={`w-40 h-60 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-xs text-stone-500
        ${dropHint ? 'border-amber-500 bg-amber-50/5 cursor-pointer' : 'border-stone-700/60 bg-mesa-claro/30'}`}
    >
      <span className="opacity-60 uppercase tracking-[0.2em]">Em Confronto</span>
      <span className="opacity-40 text-[10px] mt-1">vazio</span>
    </div>
  );
}

// ====================== HAND (fan, em baixo) ======================
function HandStrip({
  pid, revealHand, isActive,
}: { pid: PlayerId; revealHand: boolean; isActive: boolean }) {
  const p = useGameStore((s) => s.state!.jogadores[pid]);
  const selectedHandIdx = useGameStore((s) => s.selectedHandIdx);
  const selectHandCard = useGameStore((s) => s.selectHandCard);

  const cards = p.mao;
  const count = cards.length;
  const spread = Math.min(count * 90, 900); // largura total do leque
  const step = count > 1 ? spread / (count - 1) : 0;
  const startX = -spread / 2;

  return (
    <div className="relative h-44 px-4 flex items-end justify-center bg-mesa-claro/40 border-t border-stone-800">
      <div className="relative w-full max-w-5xl h-full">
        {cards.map((c, i) => {
          const x = startX + i * step;
          const isSel = isActive && selectedHandIdx === i;
          return (
            <div
              key={i}
              className="absolute bottom-2 left-1/2 transition-all duration-200 ease-out"
              style={{
                transform: `translateX(calc(${x}px - 50%)) ${isSel ? 'translateY(-24px) scale(1.05)' : ''}`,
                zIndex: isSel ? 50 : i,
              }}
            >
              {revealHand ? (
                <div className="hover:-translate-y-3 transition-transform">
                  <Card
                    def={c}
                    size="sm"
                    selected={isSel}
                    onClick={isActive ? () => selectHandCard(selectedHandIdx === i ? null : i) : undefined}
                  />
                </div>
              ) : (
                <div className="w-28 h-40">
                  <CardBack size="sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====================== SIDEBAR (turn + controlos + log) ======================
function Sidebar() {
  const state = useGameStore((s) => s.state)!;
  const mode = useGameStore((s) => s.mode);
  const myRole = useGameStore((s) => s.myRole);
  const dispatch = useGameStore((s) => s.dispatch);
  const reset = useGameStore((s) => s.reset);
  const last8 = state.log.slice(-8).reverse();
  const me = state.jogadores[state.turnoDe];
  const podeJogar = mode === 'online' ? myRole === state.turnoDe : true;

  const retirarDisponivel = (() => {
    if (state.fase !== 'acao' || !me.emConfronto || me.companhia.length === 0) return null;
    const def = getCard(me.emConfronto.defId);
    const custo = def.retirada ?? 0;
    if (me.emConfronto.energiasAnexadas.length < custo) return null;
    return { custo, novoIid: me.companhia[0].iid };
  })();

  return (
    <aside className="w-60 shrink-0 bg-mesa-claro border-l border-stone-800 flex flex-col text-stone-200">
      <div className="px-4 py-3 border-b border-stone-800">
        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Turno</div>
        <div className="font-serif text-2xl font-bold text-amber-300">{state.numeroTurno}</div>
        <div className="text-xs text-stone-400 mt-1">
          Vez de <span className="font-bold text-amber-200">{state.turnoDe}</span>
          {mode === 'online' && myRole && (
            <span className="ml-1 text-stone-500">(tu = {myRole})</span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-stone-500 mt-1">
          Fase <span className="text-stone-300">{state.fase}</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-stone-800 flex flex-col gap-2">
        {podeJogar && state.fase === 'aurora' && (
          <button
            className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 rounded font-serif font-bold text-sm shadow"
            onClick={() => dispatch({ type: 'AURORA_DRAW' })}
          >Aurora · comprar</button>
        )}
        {podeJogar && state.fase === 'acao' && (
          <button
            className="w-full px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm font-serif"
            onClick={() => dispatch({ type: 'END_TURN' })}
          >Passar turno</button>
        )}
        {podeJogar && retirarDisponivel && (
          <button
            className="w-full px-3 py-2 bg-stone-600 hover:bg-stone-500 rounded text-xs"
            onClick={() => dispatch({ type: 'RETIRE', novoIid: retirarDisponivel.novoIid })}
          >Retirar (paga {retirarDisponivel.custo})</button>
        )}
        {!podeJogar && (
          <div className="text-xs text-stone-400 italic text-center py-2">
            Aguarda a vez do adversário...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-stone-500">Registo</div>
        <ul className="px-4 pb-3 space-y-1 text-[11px] overflow-y-auto">
          {last8.map((e, i) => (
            <li key={i} className="text-stone-300 leading-snug">
              <span className="font-bold text-amber-300/80">T{e.turno} {e.jogador}:</span> {e.texto}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 py-2 border-t border-stone-800">
        <button
          className="text-xs text-stone-500 hover:text-stone-300 underline"
          onClick={reset}
        >Sair da partida</button>
      </div>
    </aside>
  );
}

// ====================== PÁGINA ======================
export default function Game() {
  const state = useGameStore((s) => s.state);
  const mode = useGameStore((s) => s.mode);
  const myRole = useGameStore((s) => s.myRole);
  if (!state) return null;

  if (mode === 'hotseat' && state.pendingHandoff) {
    return <HandoffOverlay proximoJogador={state.turnoDe} />;
  }

  let top: PlayerId; let bottom: PlayerId;
  let revealBottom: boolean;
  let isActiveTop: boolean; let isActiveBottom: boolean;
  let bottomIsMe: boolean;

  if (mode === 'online' && (myRole === 'P1' || myRole === 'P2')) {
    bottom = myRole;
    top = myRole === 'P1' ? 'P2' : 'P1';
    revealBottom = true;
    isActiveBottom = state.turnoDe === bottom;
    isActiveTop = false;
    bottomIsMe = true;
  } else {
    const showP2OnTop = state.turnoDe === 'P1';
    top = showP2OnTop ? 'P2' : 'P1';
    bottom = showP2OnTop ? 'P1' : 'P2';
    revealBottom = state.turnoDe === bottom;
    isActiveBottom = state.turnoDe === bottom;
    isActiveTop = state.turnoDe === top;
    bottomIsMe = true;
  }

  return (
    <div className="h-screen w-full bg-mesa text-stone-100 flex overflow-hidden font-sans">
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        <PlayerStatusBar pid={top} isMe={!bottomIsMe} isActive={isActiveTop} />
        <CompanhiaRow pid={top} isActive={isActiveTop} />
        <Battlefield
          topPid={top}
          bottomPid={bottom}
          isActiveTop={isActiveTop}
          isActiveBottom={isActiveBottom}
        />
        <CompanhiaRow pid={bottom} isActive={isActiveBottom} />
        <PlayerStatusBar pid={bottom} isMe={bottomIsMe} isActive={isActiveBottom} />
        <HandStrip pid={bottom} revealHand={revealBottom} isActive={isActiveBottom} />
      </main>
      <Sidebar />
      {state.vencedor && <EndScreen state={state} />}
    </div>
  );
}
