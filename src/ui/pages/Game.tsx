import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { Card, CardBack } from '../components/Card';
import { getCard } from '../../data/cards';
import { podePagarCusto } from '../../engine/engine';
import type { CardDef, CardInstance, GameState, PlayerId } from '../../engine/types';

// ======================================================================
// HELPERS
// ======================================================================

const nomeCurto = (nome: string) => nome.split(',')[0].trim();

function podeAtacarAlgum(state: GameState, pid: PlayerId): boolean {
  const me = state.jogadores[pid];
  const ec = me.emConfronto;
  if (!ec) return false;
  if (ec.estados.includes('paralisado') || ec.estados.includes('envergonhado')) return false;
  if (!state.jogadores[pid === 'P1' ? 'P2' : 'P1'].emConfronto) return false;
  const def = getCard(ec.defId);
  return (def.ataques ?? []).some((a) => podePagarCusto(ec.energiasAnexadas, a.custo));
}

type CoachFoco = 'comprar' | 'passar' | 'mao' | 'ataque' | 'esperar' | null;
interface Coach { titulo: string; texto: string; foco: CoachFoco }

function getCoach(state: GameState, pid: PlayerId, isMyTurn: boolean): Coach {
  if (state.vencedor)
    return { titulo: 'Fim de jogo', texto: `${state.vencedor} venceu a partida.`, foco: null };
  if (!isMyTurn)
    return { titulo: 'Vez do adversario', texto: 'Observa a jogada do adversario — a tua vez chega a seguir.', foco: 'esperar' };

  const me = state.jogadores[pid];
  if (state.fase === 'aurora')
    return {
      titulo: 'Passo 1 — Aurora',
      texto: 'Clica em "Comprar carta" para tirares 1 carta do baralho e comecares o turno.',
      foco: 'comprar',
    };

  if (!me.emConfronto) {
    const temBasico = me.mao.some((c) => (c.tipo === 'Fiel' || c.tipo === 'Adversario') && !c.evolucaoDe);
    if (temBasico)
      return {
        titulo: 'Poe um Fiel a combater',
        texto: 'Clica num Fiel Basico da tua mao e depois no espaco "Em Confronto".',
        foco: 'mao',
      };
    return { titulo: 'Sem Fiel em campo', texto: 'Nao tens Fieis para combater. Podes passar o turno.', foco: 'passar' };
  }

  const temEnergiaMao = me.mao.some((c) => c.tipo === 'Energia');
  if (!me.energiaAnexadaEsteTurno && temEnergiaMao)
    return {
      titulo: 'Liga Energia ao teu Fiel',
      texto: 'Clica numa carta de Energia e depois no teu Fiel. Sem Energia nao ha ataque (1 por turno).',
      foco: 'mao',
    };

  if (podeAtacarAlgum(state, pid))
    return {
      titulo: 'Podes atacar!',
      texto: 'Clica num ataque do teu Fiel e depois no Fiel adversario. Atencao: atacar termina o turno.',
      foco: 'ataque',
    };

  return {
    titulo: 'O teu turno',
    texto: 'Joga mais cartas da mao, ou clica "Passar turno" para terminar.',
    foco: 'passar',
  };
}

// O que estamos a tentar fazer com a carta selecionada da mao
type ModoAlvo = 'basico' | 'energia' | 'promocao' | 'cura' | 'estrutura' | 'evento' | null;
function modoDaCarta(c: CardDef | undefined): ModoAlvo {
  if (!c) return null;
  if (c.tipo === 'Energia') return 'energia';
  if (c.tipo === 'Estrutura') return 'estrutura';
  if (c.tipo === 'Evento') return c.id === 'oracao' ? 'cura' : 'evento';
  if ((c.tipo === 'Fiel' || c.tipo === 'Adversario') && c.evolucaoDe) return 'promocao';
  return 'basico';
}

// ======================================================================
// TOAST
// ======================================================================
function Toast() {
  const toast = useGameStore((s) => s.toast);
  const dismiss = useGameStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 4200);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  if (!toast) return null;
  const cor =
    toast.kind === 'erro' ? 'bg-rose-600 border-rose-800'
    : toast.kind === 'ok' ? 'bg-emerald-600 border-emerald-800'
    : 'bg-sky-700 border-sky-900';
  const icone = toast.kind === 'erro' ? '!' : toast.kind === 'ok' ? '✓' : 'i';

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,30rem)]" key={toast.id}>
      <div className={`${cor} text-white rounded-xl border-b-4 shadow-2xl px-4 py-3 flex items-start gap-3 animate-toast-in`}>
        <span className="shrink-0 w-6 h-6 rounded-full bg-white/25 flex items-center justify-center font-bold">
          {icone}
        </span>
        <p className="text-sm leading-snug flex-1 pt-0.5">{toast.text}</p>
        <button onClick={dismiss} className="shrink-0 text-white/70 hover:text-white text-lg leading-none">×</button>
      </div>
    </div>
  );
}

// ======================================================================
// MODAL "COMO JOGAR"
// ======================================================================
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-pergaminho-claro text-tinta rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto border-2 border-pergaminho-borda"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-ouro text-white px-5 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="font-serif text-2xl font-bold">Como jogar</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-4 text-sm leading-relaxed">
          <section>
            <h3 className="font-serif font-bold text-base text-ouro-escuro">Objetivo</h3>
            <p>Ganhas se acontecer <b>uma</b> destas coisas:</p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>Colheres os teus <b>6 Talentos</b> (ganhas 1 sempre que derrotas um Fiel adversario).</li>
              <li>O adversario ficar <b>sem Fieis</b> em jogo.</li>
              <li>O adversario <b>nao conseguir comprar</b> (baralho vazio).</li>
            </ul>
          </section>
          <section>
            <h3 className="font-serif font-bold text-base text-ouro-escuro">O turno tem 3 passos</h3>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li><b>Aurora</b> — clicas "Comprar carta" e tiras 1 carta.</li>
              <li><b>Acao</b> — jogas Fieis, ligas Energia (1 por turno), jogas Eventos e Estruturas.</li>
              <li><b>Confronto</b> — o teu Fiel "Em Confronto" pode atacar 1 vez. <b>Atacar termina o turno.</b></li>
            </ol>
          </section>
          <section>
            <h3 className="font-serif font-bold text-base text-ouro-escuro">Pecas do jogo</h3>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li><b>Fiel</b> — criatura com HP. Precisa de Energia ligada para atacar.</li>
              <li><b>Em Confronto</b> — o Fiel que esta a combater agora.</li>
              <li><b>Companhia</b> — ate 5 Fieis de reserva.</li>
              <li><b>Energia</b> — ligas 1 por turno a um Fiel teu.</li>
              <li><b>Promocao</b> — um Fiel Basico que ja esteve 1 turno em jogo pode ser promovido (ex.: Simao &rarr; Pedro).</li>
              <li><b>Talentos</b> — 6 cartas tapadas; recebes 1 na mao por cada Fiel adversario derrotado.</li>
            </ul>
          </section>
          <section className="bg-ouro/10 rounded-lg p-3">
            <h3 className="font-serif font-bold text-base text-ouro-escuro">Dica</h3>
            <p>Segue sempre o <b>Mestre</b> (a barra dourada): ele diz-te o proximo passo. Se clicares numa jogada que nao pode ser feita, aparece um aviso a explicar porque.</p>
          </section>
        </div>
        <div className="px-5 py-3 border-t border-pergaminho-borda">
          <button onClick={onClose} className="w-full py-2.5 bg-ouro hover:bg-ouro-escuro text-white font-serif font-bold rounded-lg">
            Entendi, vamos jogar
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// TALENTOS
// ======================================================================
function Talentos({ total, colhidos }: { total: number; colhidos: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Talentos: ${colhidos} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border ${
            i < colhidos
              ? 'bg-ouro-claro border-ouro-escuro'
              : 'bg-pergaminho-escuro border-pergaminho-borda'
          }`}
        />
      ))}
    </div>
  );
}

// ======================================================================
// LINHA DE ESTADO DO JOGADOR
// ======================================================================
function PlayerLine({ pid, isMe, isActive }: { pid: PlayerId; isMe: boolean; isActive: boolean }) {
  const p = useGameStore((s) => s.state!.jogadores[pid]);
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-1.5 text-sm ${isActive ? 'bg-ouro/15' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={`font-serif font-bold ${isActive ? 'text-ouro-escuro' : 'text-tinta'}`}>
          {isMe ? 'Tu' : 'Adversario'}
        </span>
        <span className="text-tinta-suave text-xs">{p.faccaoPrimaria}</span>
        {isActive && (
          <span className="text-[10px] uppercase tracking-wide bg-ouro text-white px-1.5 py-0.5 rounded-full">
            a jogar
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-tinta-suave">
        <span className="flex items-center gap-1" title="Talentos colhidos">
          <span className="hidden sm:inline">Talentos</span>
          <Talentos total={p.talentos.length + p.talentosColhidos.length} colhidos={p.talentosColhidos.length} />
        </span>
        <span title="Cartas na mao">✋ {p.mao.length}</span>
        <span title="Cartas no baralho">🂠 {p.baralho.length}</span>
        <span title="Cartas no Repouso">⚰ {p.repouso.length}</span>
      </div>
    </div>
  );
}

// ======================================================================
// MINI-FIEL (companhia)
// ======================================================================
function MiniFiel({
  inst, highlight, onClick,
}: { inst: CardInstance; highlight?: boolean; onClick?: () => void }) {
  const def = getCard(inst.defId);
  const hpMax = (def.hp ?? 0) + inst.hpMaximoBonus;
  const pct = hpMax > 0 ? Math.max(0, (inst.hpRestante / hpMax) * 100) : 0;
  const cor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-rose-500';
  const fac = def.faccao ?? 'Apostolos';
  return (
    <button
      onClick={onClick}
      className={`w-[6.6rem] rounded-lg overflow-hidden border-2 text-left shadow
        border-${fac}-500 ${highlight ? 'ring-4 ring-ouro animate-coach-glow' : ''}
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}`}
    >
      <div className={`bg-${fac}-500 text-white px-1.5 py-0.5 text-[10px] font-bold font-serif truncate`}>
        {nomeCurto(def.nome)}
      </div>
      <div className={`bg-${fac}-50 px-1.5 py-1`}>
        <div className="flex items-center justify-between text-[9px] text-tinta">
          <span className="font-bold">{inst.hpRestante}/{hpMax} HP</span>
          {inst.energiasAnexadas.length > 0 && (
            <span className="text-tinta-suave">⚡{inst.energiasAnexadas.length}</span>
          )}
        </div>
        <div className="h-1 mt-0.5 rounded bg-black/15 overflow-hidden">
          <div className={`h-full ${cor}`} style={{ width: `${pct}%` }} />
        </div>
        {inst.estados.length > 0 && (
          <div className="text-[7.5px] uppercase font-bold text-rose-700 mt-0.5 truncate">
            {inst.estados.join(' · ')}
          </div>
        )}
      </div>
    </button>
  );
}

// ======================================================================
// COMPANHIA
// ======================================================================
function CompanhiaStrip({
  pid, podeAlvo, onSlotVazio, onInstancia,
}: {
  pid: PlayerId;
  podeAlvo: (inst: CardInstance) => boolean;
  onSlotVazio: () => void;
  onInstancia: (iid: string) => void;
}) {
  const p = useGameStore((s) => s.state!.jogadores[pid]);
  return (
    <div className="flex items-center justify-center gap-2 px-3 min-h-[5.6rem]">
      <span className="text-[10px] uppercase tracking-widest text-tinta-fraca w-16 text-right shrink-0">
        Companhia
      </span>
      {Array.from({ length: 5 }).map((_, i) => {
        const inst = p.companhia[i];
        if (inst) {
          return <MiniFiel key={inst.iid} inst={inst} highlight={podeAlvo(inst)} onClick={() => onInstancia(inst.iid)} />;
        }
        return (
          <button
            key={`v${i}`}
            onClick={onSlotVazio}
            className="w-[6.6rem] h-[4.4rem] rounded-lg border-2 border-dashed border-pergaminho-borda
              bg-pergaminho/40 text-[9px] text-tinta-fraca hover:bg-pergaminho-medio/60 transition-colors"
          >
            livre
          </button>
        );
      })}
    </div>
  );
}

// ======================================================================
// BATTLEFIELD (centro)
// ======================================================================
function ConfrontoSlot({
  inst, label, lado, podeAlvo, atacavel,
  onClickVazio, onClickInstancia, onAttack, selectedAttackIdx, attacksActive,
}: {
  inst: CardInstance | null;
  label: string;
  lado: 'adversario' | 'meu';
  podeAlvo?: boolean;
  atacavel?: boolean;
  onClickVazio: () => void;
  onClickInstancia: () => void;
  onAttack?: (i: number) => void;
  selectedAttackIdx?: number | null;
  attacksActive?: boolean;
}) {
  const corLabel = lado === 'adversario'
    ? 'text-rose-700 bg-rose-100 border-rose-300'
    : 'text-ouro-escuro bg-ouro/15 border-ouro/40';
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${corLabel}`}>
        {label}
      </span>
      {inst ? (
        <Card
          def={getCard(inst.defId)}
          instance={inst}
          size="md"
          attackTarget={atacavel}
          highlight={podeAlvo}
          onClick={onClickInstancia}
          onAttackClick={attacksActive ? onAttack : undefined}
          selectedAttackIdx={attacksActive ? selectedAttackIdx : null}
        />
      ) : (
        <button
          onClick={onClickVazio}
          className="w-[11.2rem] h-[15.8rem] rounded-xl border-2 border-dashed border-pergaminho-borda
            bg-pergaminho/40 flex flex-col items-center justify-center gap-1 hover:bg-pergaminho-medio/60 transition-colors"
        >
          <span className="text-3xl opacity-30">+</span>
          <span className="text-xs text-tinta-fraca uppercase tracking-wider">Em Confronto</span>
          <span className="text-[10px] text-tinta-fraca">(vazio)</span>
        </button>
      )}
    </div>
  );
}

// ======================================================================
// MAO
// ======================================================================
function HandRow({
  pid, reveal, isActive, selectedIdx, onCardClick,
}: {
  pid: PlayerId;
  reveal: boolean;
  isActive: boolean;
  selectedIdx: number | null;
  onCardClick: (idx: number) => void;
}) {
  const p = useGameStore((s) => s.state!.jogadores[pid]);
  return (
    <div className="flex items-end justify-center gap-2 flex-wrap px-3 py-2 min-h-[13.5rem]">
      {p.mao.map((c, i) => {
        if (!reveal) {
          return <div key={i}><CardBack size="sm" /></div>;
        }
        const sel = isActive && selectedIdx === i;
        return (
          <div
            key={i}
            className={`transition-transform duration-150 ${sel ? '-translate-y-3' : 'hover:-translate-y-2'}`}
          >
            <Card def={c} size="sm" selected={sel} onClick={() => onCardClick(i)} />
          </div>
        );
      })}
      {p.mao.length === 0 && <span className="text-tinta-fraca italic text-sm">Mao vazia</span>}
    </div>
  );
}

// ======================================================================
// HANDOFF (hot-seat)
// ======================================================================
function HandoffOverlay({ proximo }: { proximo: PlayerId }) {
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <div className="fixed inset-0 z-50 bg-tinta flex flex-col items-center justify-center text-pergaminho-claro px-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔄</div>
        <h2 className="text-3xl font-serif font-bold mb-2">Passa o dispositivo</h2>
        <p className="text-pergaminho-escuro mb-1">
          Agora joga <span className="text-ouro-claro font-bold">{proximo === 'P1' ? 'o Jogador 1' : 'o Jogador 2'}</span>.
        </p>
        <p className="text-pergaminho-escuro/70 italic text-sm mb-8">
          Nao espreites a mao se nao for a tua vez.
        </p>
        <button
          className="px-8 py-3 bg-ouro hover:bg-ouro-claro text-white font-serif font-bold rounded-xl shadow-lg text-lg"
          onClick={() => dispatch({ type: 'COMPLETE_HANDOFF' })}
        >
          Estou pronto — continuar
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// FIM DE JOGO
// ======================================================================
function EndScreen({ state }: { state: GameState }) {
  const reset = useGameStore((s) => s.reset);
  const motivo = state.motivoVitoria === 'talentos' ? 'Colheu os 6 Talentos'
               : state.motivoVitoria === 'sem_fieis' ? 'O adversario ficou sem Fieis'
               : 'O adversario ficou sem cartas';
  return (
    <div className="fixed inset-0 z-50 bg-tinta/95 backdrop-blur flex flex-col items-center justify-center text-pergaminho-claro px-8">
      <div className="text-6xl mb-4">🏆</div>
      <h1 className="text-5xl font-serif font-bold mb-2 text-ouro-claro">
        {state.vencedor === 'P1' ? 'Jogador 1' : 'Jogador 2'} venceu!
      </h1>
      <p className="text-pergaminho-escuro mb-8 italic">{motivo}</p>
      <button
        className="px-8 py-3 bg-ouro hover:bg-ouro-claro text-white font-serif font-bold rounded-xl text-lg shadow-lg"
        onClick={reset}
      >
        Voltar ao menu
      </button>
    </div>
  );
}

// ======================================================================
// PAGINA
// ======================================================================
export default function Game() {
  const state = useGameStore((s) => s.state);
  const mode = useGameStore((s) => s.mode);
  const myRole = useGameStore((s) => s.myRole);
  const selectedHandIdx = useGameStore((s) => s.selectedHandIdx);
  const selectedAttackIdx = useGameStore((s) => s.selectedAttackIdx);
  const selectHandCard = useGameStore((s) => s.selectHandCard);
  const selectAttack = useGameStore((s) => s.selectAttack);
  const tryAction = useGameStore((s) => s.tryAction);
  const notify = useGameStore((s) => s.notify);
  const reset = useGameStore((s) => s.reset);

  const [ajuda, setAjuda] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('tcg_viu_ajuda')) {
      setAjuda(true);
      localStorage.setItem('tcg_viu_ajuda', '1');
    }
  }, []);

  if (!state) return null;

  if (mode === 'hotseat' && state.pendingHandoff) {
    return <HandoffOverlay proximo={state.turnoDe} />;
  }

  // --- perspetiva ---
  let topPid: PlayerId; let bottomPid: PlayerId;
  let revealBottom: boolean; let isBottomTurn: boolean;
  if (mode === 'online' && (myRole === 'P1' || myRole === 'P2')) {
    bottomPid = myRole;
    topPid = myRole === 'P1' ? 'P2' : 'P1';
    revealBottom = true;
    isBottomTurn = state.turnoDe === bottomPid;
  } else {
    const p2cima = state.turnoDe === 'P1';
    topPid = p2cima ? 'P2' : 'P1';
    bottomPid = p2cima ? 'P1' : 'P2';
    revealBottom = true;
    isBottomTurn = true;
  }

  const isMyTurn = isBottomTurn;
  const me = state.jogadores[bottomPid];
  const podeJogar = mode === 'online' ? myRole === bottomPid && isMyTurn : isMyTurn;

  const cartaSel = selectedHandIdx !== null ? me.mao[selectedHandIdx] : undefined;
  const modo = modoDaCarta(cartaSel);
  const coachBase = getCoach(state, bottomPid, isMyTurn);

  // coach efetivo (sobreposto quando ha selecao)
  let coach: Coach = coachBase;
  if (cartaSel) {
    const instr: Record<string, string> = {
      basico: `Clica no espaco "Em Confronto" ou num espaco livre da "Companhia" para colocares "${nomeCurto(cartaSel.nome)}".`,
      energia: 'Clica num Fiel TEU para lhe ligares esta Energia.',
      promocao: `Clica no Fiel Basico que queres promover a "${nomeCurto(cartaSel.nome)}".`,
      cura: 'Clica no Fiel teu que queres curar com a Oracao.',
      estrutura: 'Clica no botao "Colocar em jogo" aqui em baixo.',
      evento: 'Clica no botao "Jogar" aqui em baixo.',
    };
    coach = { titulo: `Selecionado: ${nomeCurto(cartaSel.nome)}`, texto: instr[modo ?? 'basico'] ?? '', foco: 'mao' };
  } else if (selectedAttackIdx !== null && me.emConfronto) {
    const atk = getCard(me.emConfronto.defId).ataques?.[selectedAttackIdx];
    coach = {
      titulo: `Ataque escolhido: ${atk?.nome ?? ''}`,
      texto: 'Clica no Fiel do adversario para atacar. Isto vai terminar o teu turno.',
      foco: 'ataque',
    };
  }

  // --- interacoes ---
  const limparSelecao = () => { selectHandCard(null); selectAttack(null); };

  const clickHandCard = (idx: number) => {
    if (!podeJogar) {
      notify(mode === 'online' ? 'Espera — e a vez do adversario.' : 'Aguarda a tua vez.', 'erro');
      return;
    }
    if (state.fase === 'aurora') {
      notify('Primeiro tens de comprar a carta do turno. Clica em "Comprar carta".', 'erro');
      return;
    }
    selectHandCard(selectedHandIdx === idx ? null : idx);
  };

  const clickMeuFiel = (iid: string) => {
    if (!podeJogar) { notify('Aguarda a tua vez.', 'erro'); return; }
    if (selectedHandIdx === null) {
      notify('Escolhe primeiro uma carta da tua mao.', 'info');
      return;
    }
    const idx = selectedHandIdx;
    if (modo === 'energia') tryAction({ type: 'ATTACH_ENERGY', targetIid: iid, cardIdx: idx });
    else if (modo === 'promocao') tryAction({ type: 'PROMOTE', targetIid: iid, cardIdx: idx });
    else if (modo === 'cura') tryAction({ type: 'PLAY_EVENT', cardIdx: idx, alvoIid: iid });
    else if (modo === 'basico') notify('Esse espaco ja tem um Fiel. Joga o Basico num espaco livre.', 'erro');
    else if (modo === 'estrutura') notify('Usa o botao "Colocar em jogo" para a Estrutura.', 'info');
    else notify('Essa carta nao se usa assim.', 'erro');
  };

  const clickSlotVazio = (slot: 'emConfronto' | 'companhia') => {
    if (!podeJogar) { notify('Aguarda a tua vez.', 'erro'); return; }
    if (selectedHandIdx === null) {
      notify('Escolhe primeiro um Fiel Basico da tua mao.', 'info');
      return;
    }
    const idx = selectedHandIdx;
    if (modo === 'basico') tryAction({ type: 'PLAY_BASIC', cardIdx: idx, slot });
    else if (modo === 'energia') notify('A Energia liga-se a um Fiel, nao a um espaco vazio.', 'erro');
    else if (modo === 'promocao') notify('A Promocao precisa de um Fiel Basico ja em jogo.', 'erro');
    else if (modo === 'cura') notify('A Oracao precisa de um Fiel teu como alvo.', 'erro');
    else if (modo === 'estrutura') notify('Usa o botao "Colocar em jogo" para a Estrutura.', 'info');
  };

  const clickFielAdversario = () => {
    if (selectedAttackIdx !== null) {
      tryAction({ type: 'ATTACK', ataqueIdx: selectedAttackIdx });
      selectAttack(null);
    } else if (selectedHandIdx !== null) {
      notify('Esse Fiel e do adversario. Joga as tuas cartas no teu lado.', 'erro');
    } else {
      notify('Para atacar: clica primeiro num ataque do TEU Fiel.', 'info');
    }
  };

  const clickAtaque = (i: number) => {
    if (!podeJogar) { notify('Aguarda a tua vez.', 'erro'); return; }
    selectAttack(selectedAttackIdx === i ? null : i);
  };

  // alvos validos para destacar
  const fielEhAlvo = (inst: CardInstance): boolean => {
    if (selectedHandIdx === null) return false;
    if (modo === 'energia' || modo === 'cura') return true;
    if (modo === 'promocao' && cartaSel) {
      const ultimo = inst.evolucoes[inst.evolucoes.length - 1];
      return ultimo === cartaSel.evolucaoDe;
    }
    return false;
  };
  const advAtacavel = selectedAttackIdx !== null && !!state.jogadores[topPid].emConfronto;

  // --- accao da barra: retirar ---
  const retirar = (() => {
    if (state.fase !== 'acao' || !me.emConfronto || me.companhia.length === 0) return null;
    const def = getCard(me.emConfronto.defId);
    const custo = def.retirada ?? 0;
    if (me.emConfronto.energiasAnexadas.length < custo) return null;
    return { custo, novoIid: me.companhia[0].iid };
  })();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pergaminho-claro via-pergaminho to-pergaminho-escuro flex flex-col font-sans text-tinta">
      {/* ---------- TOP BAR ---------- */}
      <header className="sticky top-0 z-40 bg-tinta text-pergaminho-claro flex items-center justify-between px-4 h-12 shadow-md">
        <button onClick={reset} className="text-sm text-pergaminho-escuro hover:text-pergaminho-claro">
          ← Sair
        </button>
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-lg">TCG Biblico</span>
          <span className="text-xs bg-pergaminho-claro/15 rounded-full px-2.5 py-1">
            Turno <b className="text-ouro-claro">{state.numeroTurno}</b>
            <span className="mx-1 opacity-50">·</span>
            Fase <b className="text-ouro-claro capitalize">{state.fase}</b>
          </span>
        </div>
        <button
          onClick={() => setAjuda(true)}
          className="text-sm bg-ouro hover:bg-ouro-claro text-white rounded-full px-3 py-1 font-semibold"
        >
          ? Como jogar
        </button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 py-2 flex flex-col gap-1.5">
        {/* ---------- ADVERSARIO ---------- */}
        <section className="rounded-xl bg-pergaminho-claro/70 border border-pergaminho-borda overflow-hidden">
          <PlayerLine pid={topPid} isMe={false} isActive={!isBottomTurn} />
          <CompanhiaStrip
            pid={topPid}
            podeAlvo={() => false}
            onSlotVazio={() => {}}
            onInstancia={() => {}}
          />
        </section>

        {/* ---------- CAMPO DE BATALHA ---------- */}
        <section className="rounded-xl bg-tinta/90 border border-tinta py-3 px-4 flex items-center justify-center gap-4 sm:gap-10">
          <ConfrontoSlot
            inst={state.jogadores[topPid].emConfronto}
            label="Fiel do adversario"
            lado="adversario"
            atacavel={advAtacavel}
            onClickVazio={() => notify('Esse e o lado do adversario.', 'info')}
            onClickInstancia={clickFielAdversario}
          />
          <div className="flex flex-col items-center text-pergaminho-escuro">
            <span className="text-2xl">⚔</span>
            <span className="text-[9px] uppercase tracking-[0.3em]">contra</span>
          </div>
          <ConfrontoSlot
            inst={me.emConfronto}
            label="O teu Fiel"
            lado="meu"
            podeAlvo={!!me.emConfronto && fielEhAlvo(me.emConfronto)}
            onClickVazio={() => clickSlotVazio('emConfronto')}
            onClickInstancia={() => me.emConfronto && clickMeuFiel(me.emConfronto.iid)}
            onAttack={clickAtaque}
            selectedAttackIdx={selectedAttackIdx}
            attacksActive={podeJogar && state.fase === 'acao'}
          />
        </section>

        {/* ---------- A MINHA COMPANHIA ---------- */}
        <section className="rounded-xl bg-pergaminho-claro/70 border border-pergaminho-borda overflow-hidden">
          <CompanhiaStrip
            pid={bottomPid}
            podeAlvo={(inst) => fielEhAlvo(inst)}
            onSlotVazio={() => clickSlotVazio('companhia')}
            onInstancia={(iid) => clickMeuFiel(iid)}
          />
          <PlayerLine pid={bottomPid} isMe isActive={isBottomTurn} />
        </section>

        {/* ---------- MESTRE (COACH) ---------- */}
        <div className={`rounded-xl border-l-4 px-4 py-2.5 flex items-start gap-3
          ${coach.foco === 'esperar' ? 'bg-stone-200 border-stone-400' : 'bg-ouro/15 border-ouro animate-coach-glow'}`}>
          <span className="text-2xl shrink-0">{coach.foco === 'esperar' ? '⏳' : '💡'}</span>
          <div className="flex-1">
            <div className="font-serif font-bold text-ouro-escuro leading-tight">{coach.titulo}</div>
            <div className="text-sm text-tinta leading-snug">{coach.texto}</div>
          </div>
          {(cartaSel || selectedAttackIdx !== null) && (
            <button
              onClick={limparSelecao}
              className="shrink-0 text-xs bg-tinta/10 hover:bg-tinta/20 rounded-lg px-2.5 py-1 self-center"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* ---------- BARRA DE ACOES ---------- */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {podeJogar && state.fase === 'aurora' && (
            <button
              onClick={() => tryAction({ type: 'AURORA_DRAW' })}
              className={`px-6 py-2.5 rounded-xl font-serif font-bold text-white shadow-lg
                bg-ouro hover:bg-ouro-escuro ${coach.foco === 'comprar' ? 'animate-coach-glow ring-2 ring-ouro-claro' : ''}`}
            >
              📥 Comprar carta
            </button>
          )}
          {podeJogar && state.fase === 'acao' && (
            <>
              {modo === 'estrutura' && selectedHandIdx !== null && (
                <button
                  onClick={() => tryAction({ type: 'PLAY_STRUCTURE', cardIdx: selectedHandIdx })}
                  className="px-5 py-2.5 rounded-xl font-bold text-white shadow bg-emerald-600 hover:bg-emerald-700"
                >
                  ▶ Colocar em jogo
                </button>
              )}
              {retirar && (
                <button
                  onClick={() => tryAction({ type: 'RETIRE', novoIid: retirar.novoIid })}
                  className="px-4 py-2.5 rounded-xl font-semibold text-tinta bg-pergaminho-escuro hover:bg-pergaminho-borda shadow"
                  title={`Troca o Fiel em Confronto (paga ${retirar.custo} Energia)`}
                >
                  ↩ Retirar Fiel
                </button>
              )}
              <button
                onClick={() => { limparSelecao(); tryAction({ type: 'END_TURN' }); }}
                className={`px-5 py-2.5 rounded-xl font-serif font-bold text-white shadow
                  bg-tinta hover:bg-tinta-suave ${coach.foco === 'passar' ? 'ring-2 ring-ouro' : ''}`}
              >
                Passar turno →
              </button>
            </>
          )}
          {!podeJogar && (
            <div className="text-sm text-tinta-suave italic px-4 py-2">⏳ A aguardar o adversario...</div>
          )}
        </div>

        {/* ---------- A MINHA MAO ---------- */}
        <section className="rounded-xl bg-pergaminho-claro/80 border border-pergaminho-borda">
          <div className="text-[10px] uppercase tracking-widest text-tinta-fraca px-3 pt-1.5">
            A tua mao — clica numa carta para a jogares
          </div>
          <HandRow
            pid={bottomPid}
            reveal={revealBottom}
            isActive={podeJogar}
            selectedIdx={selectedHandIdx}
            onCardClick={clickHandCard}
          />
        </section>
      </main>

      <Toast />
      {ajuda && <HelpModal onClose={() => setAjuda(false)} />}
      {state.vencedor && <EndScreen state={state} />}
    </div>
  );
}
