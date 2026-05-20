import type { CardDef, CardInstance, EnergyType, Faccao } from '../../engine/types';

// ====================== PALETA POR FACCAO ======================
const FACCAO: Record<Faccao, { header: string; body: string; borda: string; texto: string }> = {
  Apostolos:  { header: 'bg-apostolos-500',  body: 'bg-apostolos-50',  borda: 'border-apostolos-500',  texto: 'text-apostolos-900' },
  Reis:       { header: 'bg-reis-500',       body: 'bg-reis-50',       borda: 'border-reis-500',       texto: 'text-reis-900' },
  Profetas:   { header: 'bg-profetas-500',   body: 'bg-profetas-50',   borda: 'border-profetas-500',   texto: 'text-profetas-900' },
  Patriarcas: { header: 'bg-patriarcas-500', body: 'bg-patriarcas-50', borda: 'border-patriarcas-500', texto: 'text-patriarcas-900' },
  Juizes:     { header: 'bg-juizes-500',     body: 'bg-juizes-50',     borda: 'border-juizes-500',     texto: 'text-juizes-900' },
  Filisteus:  { header: 'bg-filisteus-500',  body: 'bg-filisteus-50',  borda: 'border-filisteus-500',  texto: 'text-filisteus-900' },
  Egipto:     { header: 'bg-egipto-500',     body: 'bg-egipto-50',     borda: 'border-egipto-500',     texto: 'text-egipto-900' },
  Babilonia:  { header: 'bg-babilonia-500',  body: 'bg-babilonia-50',  borda: 'border-babilonia-500',  texto: 'text-babilonia-900' },
  Canaa:      { header: 'bg-canaa-500',      body: 'bg-canaa-50',      borda: 'border-canaa-500',      texto: 'text-canaa-900' },
  Roma:       { header: 'bg-roma-500',       body: 'bg-roma-50',       borda: 'border-roma-500',       texto: 'text-roma-900' },
};

const NEUTRO = { header: 'bg-tinta-suave', body: 'bg-pergaminho-claro', borda: 'border-tinta-suave', texto: 'text-tinta' };

// ====================== ENERGIA ======================
const ENERGIA: Record<EnergyType, { cor: string; label: string; nome: string }> = {
  Generica:  { cor: 'bg-stone-400 text-white',     label: '◆',  nome: 'Generica' },
  Fe:        { cor: 'bg-amber-300 text-amber-900', label: 'Fe', nome: 'Fe' },
  Coragem:   { cor: 'bg-rose-400 text-white',      label: 'Co', nome: 'Coragem' },
  Sabedoria: { cor: 'bg-indigo-400 text-white',    label: 'Sa', nome: 'Sabedoria' },
  Pregacao:  { cor: 'bg-sky-500 text-white',       label: 'Pr', nome: 'Pregacao' },
  Zelo:      { cor: 'bg-orange-500 text-white',    label: 'Ze', nome: 'Zelo' },
  Dominio:   { cor: 'bg-stone-700 text-white',     label: 'Do', nome: 'Dominio' },
};

export function EnergyChip({ tipo, size = 'md' }: { tipo: EnergyType; size?: 'xs' | 'md' }) {
  const e = ENERGIA[tipo];
  const dim = size === 'xs' ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center justify-center ${dim} font-bold rounded-full ${e.cor} shadow-sm ring-1 ring-black/10`}
      title={e.nome}
    >
      {e.label}
    </span>
  );
}

// ====================== CARTA ======================
interface CardProps {
  def: CardDef;
  instance?: CardInstance;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  highlight?: boolean;       // alvo valido (anel dourado)
  attackTarget?: boolean;    // inimigo atacavel (anel vermelho)
  dim?: boolean;             // esbatida (nao interativa)
  onClick?: () => void;
  onAttackClick?: (idx: number) => void;
  selectedAttackIdx?: number | null;
}

const SIZE = {
  sm: { w: 'w-[8.6rem]', h: 'h-[12.2rem]', name: 'text-[11.5px]', body: 'text-[9px]', big: 'text-base' },
  md: { w: 'w-[11.2rem]', h: 'h-[15.8rem]', name: 'text-[14px]', body: 'text-[10.5px]', big: 'text-xl' },
  lg: { w: 'w-[14rem]', h: 'h-[19.6rem]', name: 'text-[17px]', body: 'text-[12px]', big: 'text-2xl' },
};

export function Card({
  def, instance, size = 'md', selected, highlight, attackTarget, dim,
  onClick, onAttackClick, selectedAttackIdx,
}: CardProps) {
  const s = SIZE[size];
  const pal = def.faccao ? FACCAO[def.faccao] : NEUTRO;

  const ring =
    selected ? 'ring-4 ring-ouro shadow-xl'
    : attackTarget ? 'ring-4 ring-rose-500 shadow-xl animate-coach-glow'
    : highlight ? 'ring-4 ring-ouro-claro shadow-lg'
    : 'ring-1 ring-black/10';

  const wrap = `relative ${s.w} ${s.h} rounded-xl overflow-hidden flex flex-col
    border ${pal.borda} ${ring} ${dim ? 'opacity-55 saturate-50' : ''}
    ${onClick ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}
    shadow-md select-none`;

  // ---------- ENERGIA ----------
  if (def.tipo === 'Energia') {
    const e = def.fornecesEnergia ? ENERGIA[def.fornecesEnergia] : null;
    return (
      <div className={`${wrap} bg-gradient-to-b from-pergaminho-claro to-pergaminho-medio`} onClick={onClick}>
        <div className="px-2 pt-2 text-center">
          <div className={`font-serif font-bold ${s.name} text-tinta`}>Energia</div>
          <div className={`${s.body} text-tinta-suave`}>{e?.nome ?? def.nome}</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {def.fornecesEnergia && (
            <div className={`${e?.cor} rounded-full ${size === 'sm' ? 'w-14 h-14 text-xl' : 'w-20 h-20 text-3xl'}
              flex items-center justify-center font-bold shadow-lg ring-2 ring-black/10`}>
              {e?.label}
            </div>
          )}
        </div>
        <div className={`px-2 pb-2 ${s.body} italic text-tinta-fraca text-center leading-tight line-clamp-2`}>
          {def.flavor}
        </div>
      </div>
    );
  }

  // ---------- EVENTO / ESTRUTURA ----------
  if (def.tipo === 'Evento' || def.tipo === 'Estrutura') {
    const etiqueta = def.tipo === 'Evento' ? (def.subtipo ?? 'Evento') : 'Estrutura';
    return (
      <div className={`${wrap} ${pal.body}`} onClick={onClick}>
        <div className={`${pal.header} text-white px-2 py-1.5`}>
          <div className={`font-serif font-bold ${s.name} leading-tight`}>{def.nome}</div>
          <div className="text-[8px] uppercase tracking-[0.15em] opacity-80">{etiqueta}</div>
        </div>
        <div className={`flex-1 px-2 py-2 ${s.body} ${pal.texto} leading-snug`}>
          {def.efeitoTexto}
        </div>
        <div className={`px-2 pb-2 ${s.body} italic text-tinta-fraca leading-tight line-clamp-2`}>
          {def.flavor}
        </div>
      </div>
    );
  }

  // ---------- FIEL / ADVERSARIO ----------
  const hpBase = def.hp ?? 0;
  const hpMax = hpBase + (instance?.hpMaximoBonus ?? 0);
  const hpAtual = instance?.hpRestante ?? hpMax;
  const hpPct = hpMax > 0 ? Math.max(0, Math.min(100, (hpAtual / hpMax) * 100)) : 0;
  const hpCor = hpPct > 60 ? 'bg-emerald-500' : hpPct > 30 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className={`${wrap} ${pal.body}`} onClick={onClick}>
      {/* Cabecalho */}
      <div className={`${pal.header} text-white px-2 py-1 flex items-center justify-between gap-1`}>
        <span className={`font-serif font-bold ${s.name} leading-tight truncate`}>{def.nome}</span>
        <span className="shrink-0 bg-white/95 rounded-full px-1.5 py-0.5 text-rose-700 font-extrabold text-[10px] leading-none">
          {hpAtual}<span className="text-tinta-fraca font-semibold">/{hpMax}</span>
        </span>
      </div>

      {/* Barra de HP (so instancias em jogo) */}
      {instance && (
        <div className="h-1.5 bg-black/15">
          <div className={`h-full ${hpCor} transition-all`} style={{ width: `${hpPct}%` }} />
        </div>
      )}

      <div className={`flex-1 flex flex-col gap-1 px-1.5 py-1.5 ${pal.texto}`}>
        {/* Tags */}
        <div className="flex flex-wrap gap-0.5 items-center text-[8px] uppercase tracking-wide">
          <span className="font-bold opacity-70">{def.faccao}</span>
          {def.tags.map((t) => (
            <span key={t} className="bg-black/10 rounded px-1 py-px">{t}</span>
          ))}
          {def.evolucaoDe && <span className="bg-ouro/25 text-ouro-escuro rounded px-1 py-px font-bold">Promovido</span>}
        </div>

        {/* Energia anexada */}
        {instance && instance.energiasAnexadas.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {instance.energiasAnexadas.map((e, i) => <EnergyChip key={i} tipo={e} size="xs" />)}
          </div>
        )}

        {/* Ataques */}
        <div className="flex-1 flex flex-col gap-1">
          {def.ataques?.map((a, i) => {
            const sel = selectedAttackIdx === i;
            return (
              <div
                key={i}
                onClick={onAttackClick ? (ev) => { ev.stopPropagation(); onAttackClick(i); } : undefined}
                className={`rounded-md border border-black/10 px-1.5 py-1 bg-white/55
                  ${onAttackClick ? 'cursor-pointer hover:bg-ouro-claro/30' : ''}
                  ${sel ? 'bg-ouro-claro/60 ring-2 ring-ouro' : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {a.custo.map((e, j) => <EnergyChip key={j} tipo={e} size="xs" />)}
                    <span className={`font-bold ${s.body}`}>{a.nome}</span>
                  </div>
                  <span className={`font-extrabold ${s.big} leading-none`}>{a.dano > 0 ? a.dano : '—'}</span>
                </div>
                {a.texto && size !== 'sm' && (
                  <div className="text-[8.5px] italic text-tinta-suave leading-tight mt-0.5">{a.texto}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Efeito passivo */}
        {def.efeitoTexto && size !== 'sm' && (
          <div className="text-[8.5px] leading-tight bg-black/5 rounded px-1 py-0.5">{def.efeitoTexto}</div>
        )}

        {/* Rodape */}
        <div className="flex items-end justify-between gap-1">
          <span className="text-[8px] italic text-tinta-fraca leading-tight line-clamp-2 flex-1">{def.flavor}</span>
          {def.retirada !== undefined && (
            <span className="shrink-0 text-[8px] text-tinta-suave" title="Custo de retirada">
              Retirar: {def.retirada}
            </span>
          )}
        </div>
      </div>

      {/* Estados */}
      {instance?.estados && instance.estados.length > 0 && (
        <div className="absolute top-7 right-1 flex flex-col gap-0.5 items-end">
          {instance.estados.map((e) => (
            <span key={e} className="text-[7.5px] uppercase font-bold bg-rose-700 text-white px-1 py-px rounded shadow">
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== COSTAS (Biblia cinzenta) ======================
export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'w-[8.6rem] h-[12.2rem]' : size === 'lg' ? 'w-[14rem] h-[19.6rem]' : 'w-[11.2rem] h-[15.8rem]';
  return (
    <div className={`${dims} relative rounded-xl overflow-hidden border border-biblia-borda shadow-md bg-biblia-capa`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.10) 0%, transparent 55%, rgba(0,0,0,0.20) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-25 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 0.5px, transparent 0.5px)',
          backgroundSize: '4px 4px',
        }}
      />
      <div className="absolute inset-[6px] border border-biblia-tetragramaSombra/40 rounded-md" />
      <div className="absolute inset-[9px] border border-white/15 rounded-md" />

      <div className="absolute inset-0 flex flex-col items-center justify-between py-5">
        <div className="text-center text-biblia-texto">
          <div className="font-serif text-[8px] tracking-[0.22em] uppercase opacity-80">Traducao do</div>
          <div className="font-serif text-[11px] font-bold tracking-[0.22em] uppercase mt-0.5">Novo Mundo</div>
          <div className="font-serif text-[6px] tracking-[0.25em] uppercase opacity-60 mt-1">das Escrituras Sagradas</div>
        </div>
        <div className="flex flex-col items-center">
          <div
            className="font-serif text-biblia-tetragrama"
            style={{
              fontSize: size === 'sm' ? '34px' : size === 'lg' ? '66px' : '50px',
              direction: 'rtl',
              letterSpacing: '3px',
              textShadow: '0 1px 0 rgba(255,255,255,0.25), 0 -1px 0 rgba(0,0,0,0.4)',
              fontWeight: 700,
            }}
            aria-label="Tetragrama YHWH"
          >
            יהוה
          </div>
          <div className="font-serif text-[7px] text-biblia-tetragrama/70 mt-2 tracking-[0.3em] font-semibold">JEOVA</div>
        </div>
        <div className="text-center text-biblia-texto/60 text-[6px] tracking-[0.25em] uppercase font-serif italic">
          Edicao Portugal
        </div>
      </div>
    </div>
  );
}
