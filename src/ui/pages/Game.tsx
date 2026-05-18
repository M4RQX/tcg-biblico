import { useGameStore } from '../../store/game-store';
import { Card, CardBack } from '../components/Card';
import { getCard } from '../../data/cards';
import type { CardDef, GameState, PlayerId } from '../../engine/types';

function HandoffOverlay({ proximoJogador }: { proximoJogador: PlayerId }) {
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/95 flex flex-col items-center justify-center text-stone-100">
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

function EndScreen({ state }: { state: GameState }) {
  const reset = useGameStore((s) => s.reset);
  const motivo = state.motivoVitoria === 'talentos' ? '6 Talentos colhidos'
               : state.motivoVitoria === 'sem_fieis' ? 'Adversário sem Fiéis'
               : 'Baralho adversário vazio';
  return (
    <div className="fixed inset-0 z-40 bg-stone-900/90 flex flex-col items-center justify-center text-stone-100">
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

function TalentosRow({ talentos, colhidos }: { talentos: CardDef[]; colhidos: CardDef[] }) {
  return (
    <div className="flex gap-1 items-center">
      {talentos.map((_, i) => (
        <div key={i} className="w-8 h-12">
          <CardBack size="sm" />
        </div>
      ))}
      {colhidos.map((_, i) => (
        <div
          key={`c${i}`}
          className="w-8 h-12 bg-amber-200 border border-amber-500 rounded-sm flex items-center justify-center text-amber-900 font-bold"
        >
          ✓
        </div>
      ))}
      <span className="text-xs text-stone-500 ml-2">
        Talentos: {colhidos.length} / 6
      </span>
    </div>
  );
}

function PlayerZone({
  pid,
  revealHand,
  isActive,
}: {
  pid: PlayerId;
  revealHand: boolean;
  isActive: boolean;
}) {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const selectedHandIdx = useGameStore((s) => s.selectedHandIdx);
  const selectAttack = useGameStore((s) => s.selectAttack);
  const selectedAttackIdx = useGameStore((s) => s.selectedAttackIdx);
  const selectHandCard = useGameStore((s) => s.selectHandCard);

  const p = state.jogadores[pid];

  const onSlotClick = (slot: 'emConfronto' | 'companhia' | 'instance', iid?: string) => {
    if (!isActive) {
      // permite clicar no front adversario para confirmar ataque
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

  return (
    <div className={`flex flex-col gap-3 p-3 rounded-lg ${isActive ? 'bg-amber-50/60 ring-2 ring-amber-400' : 'bg-stone-50/40'}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="font-serif font-bold text-stone-800">
          {pid} — {p.faccaoPrimaria}
        </div>
        <div className="flex gap-3 text-xs text-stone-600">
          <span>Baralho: {p.baralho.length}</span>
          <span>Repouso: {p.repouso.length}</span>
          <span>Mão: {p.mao.length}</span>
        </div>
      </div>

      <TalentosRow talentos={p.talentos} colhidos={p.talentosColhidos} />

      {p.estruturas.length > 0 && (
        <div className="flex gap-2">
          {p.estruturas.map((e) => (
            <Card key={e.iid} def={getCard(e.defId)} instance={e} size="sm" />
          ))}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`p-2 border-2 border-dashed rounded-md min-w-[180px] min-h-[260px] flex items-center justify-center
            ${isActive && (selectedHandIdx !== null || selectedAttackIdx !== null) ? 'border-amber-500 bg-amber-100/40' : 'border-stone-300'}`}
        >
          {p.emConfronto ? (
            <Card
              def={getCard(p.emConfronto.defId)}
              instance={p.emConfronto}
              size="md"
              onClick={() => onSlotClick('instance', p.emConfronto!.iid)}
              onAttackClick={isActive ? (i) => selectAttack(i) : undefined}
              selectedAttackIdx={isActive ? selectedAttackIdx : null}
            />
          ) : (
            <div
              className="text-stone-400 text-xs text-center cursor-pointer p-4"
              onClick={() => onSlotClick('emConfronto')}
            >
              Em Confronto<br />(vazio — clica com Básico)
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wide text-stone-500 mb-1">Companhia (max 5)</div>
          <div className="flex gap-2 flex-wrap min-h-[180px]">
            {p.companhia.map((c) => (
              <Card
                key={c.iid}
                def={getCard(c.defId)}
                instance={c}
                size="sm"
                onClick={() => onSlotClick('instance', c.iid)}
              />
            ))}
            {Array.from({ length: 5 - p.companhia.length }).map((_, i) => (
              <div
                key={`empty${i}`}
                className={`w-28 h-40 border-2 border-dashed rounded-md flex items-center justify-center text-[10px] text-stone-400
                  ${isActive && selectedHandIdx !== null ? 'border-amber-400 bg-amber-50' : 'border-stone-300'}`}
                onClick={() => onSlotClick('companhia')}
              >
                Companhia
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-stone-300 pt-2">
        <div className="text-[10px] uppercase tracking-wide text-stone-500 mb-1">Mão</div>
        <div className="flex gap-1 flex-wrap">
          {p.mao.map((c, i) =>
            revealHand ? (
              <Card
                key={i}
                def={c}
                size="sm"
                selected={isActive && selectedHandIdx === i}
                onClick={isActive ? () => selectHandCard(selectedHandIdx === i ? null : i) : undefined}
              />
            ) : (
              <div key={i} className="w-28 h-40"><CardBack size="sm" /></div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function CenterStrip() {
  const state = useGameStore((s) => s.state)!;
  const dispatch = useGameStore((s) => s.dispatch);
  const last5 = state.log.slice(-5).reverse();
  const me = state.jogadores[state.turnoDe];
  const retirarDisponivel = (() => {
    if (state.fase !== 'acao' || !me.emConfronto || me.companhia.length === 0) return null;
    const def = getCard(me.emConfronto.defId);
    const custo = def.retirada ?? 0;
    if (me.emConfronto.energiasAnexadas.length < custo) return null;
    return { custo, novoIid: me.companhia[0].iid };
  })();

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-stone-200 border-y border-stone-300">
      <div className="font-serif">
        Turno <span className="font-bold">{state.numeroTurno}</span> · Vez de{' '}
        <span className="font-bold text-amber-700">{state.turnoDe}</span> · Fase{' '}
        <span className="italic">{state.fase}</span>
      </div>
      <div className="flex gap-2">
        {state.fase === 'aurora' && (
          <button
            className="px-3 py-1.5 bg-amber-600 text-stone-50 rounded text-sm hover:bg-amber-500"
            onClick={() => dispatch({ type: 'AURORA_DRAW' })}
          >
            Aurora (comprar)
          </button>
        )}
        {state.fase === 'acao' && (
          <button
            className="px-3 py-1.5 bg-stone-700 text-stone-50 rounded text-sm hover:bg-stone-600"
            onClick={() => dispatch({ type: 'END_TURN' })}
          >
            Passar turno
          </button>
        )}
        {retirarDisponivel && (
          <button
            className="px-3 py-1.5 bg-stone-500 text-stone-50 rounded text-sm hover:bg-stone-400"
            onClick={() => dispatch({ type: 'RETIRE', novoIid: retirarDisponivel.novoIid })}
            title={`Retirar (paga ${retirarDisponivel.custo} Energia)`}
          >
            Retirar (custo {retirarDisponivel.custo})
          </button>
        )}
      </div>
      <ul className="flex-1 text-[11px] text-stone-700 space-y-0.5 overflow-hidden max-h-16">
        {last5.map((e, i) => (
          <li key={i} className="truncate">
            <span className="font-bold text-stone-500">T{e.turno} {e.jogador}:</span> {e.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Game() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  if (state.pendingHandoff) {
    return <HandoffOverlay proximoJogador={state.turnoDe} />;
  }

  const showP2OnTop = state.turnoDe === 'P1';
  const top: PlayerId = showP2OnTop ? 'P2' : 'P1';
  const bottom: PlayerId = showP2OnTop ? 'P1' : 'P2';

  return (
    <div className="min-h-screen flex flex-col">
      {state.vencedor && <EndScreen state={state} />}
      <PlayerZone pid={top}    revealHand={false}                          isActive={state.turnoDe === top} />
      <CenterStrip />
      <PlayerZone pid={bottom} revealHand={state.turnoDe === bottom}        isActive={state.turnoDe === bottom} />
    </div>
  );
}
