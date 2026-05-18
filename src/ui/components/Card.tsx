import type { CardDef, CardInstance, EnergyType, Faccao } from '../../engine/types';

const FACCAO_COLORS: Record<Faccao, { bg: string; border: string; text: string; ribbon: string }> = {
  Apostolos:  { bg: 'bg-apostolos-50',  border: 'border-apostolos-500',  text: 'text-apostolos-900',  ribbon: 'bg-apostolos-500' },
  Reis:       { bg: 'bg-reis-50',       border: 'border-reis-500',       text: 'text-reis-900',       ribbon: 'bg-reis-500' },
  Profetas:   { bg: 'bg-profetas-50',   border: 'border-profetas-500',   text: 'text-profetas-900',   ribbon: 'bg-profetas-500' },
  Patriarcas: { bg: 'bg-patriarcas-50', border: 'border-patriarcas-500', text: 'text-patriarcas-900', ribbon: 'bg-patriarcas-500' },
  Juizes:     { bg: 'bg-juizes-50',     border: 'border-juizes-500',     text: 'text-juizes-900',     ribbon: 'bg-juizes-500' },
  Filisteus:  { bg: 'bg-filisteus-50',  border: 'border-filisteus-500',  text: 'text-filisteus-900',  ribbon: 'bg-filisteus-500' },
  Egipto:     { bg: 'bg-egipto-50',     border: 'border-egipto-500',     text: 'text-egipto-900',     ribbon: 'bg-egipto-500' },
  Babilonia:  { bg: 'bg-babilonia-50',  border: 'border-babilonia-500',  text: 'text-babilonia-900',  ribbon: 'bg-babilonia-500' },
  Canaa:      { bg: 'bg-canaa-50',      border: 'border-canaa-500',      text: 'text-canaa-900',      ribbon: 'bg-canaa-500' },
  Roma:       { bg: 'bg-roma-50',       border: 'border-roma-500',       text: 'text-roma-900',       ribbon: 'bg-roma-500' },
};

const ENERGY_COLOR: Record<EnergyType, string> = {
  Generica:  'bg-stone-400 text-stone-50',
  Fe:        'bg-amber-300 text-amber-900',
  Coragem:   'bg-rose-400 text-rose-50',
  Sabedoria: 'bg-indigo-400 text-indigo-50',
  Pregacao:  'bg-sky-400 text-sky-50',
  Zelo:      'bg-orange-500 text-orange-50',
  Dominio:   'bg-stone-700 text-stone-100',
};

const ENERGY_LABEL: Record<EnergyType, string> = {
  Generica:  '●',
  Fe:        'Fé',
  Coragem:   'Cor',
  Sabedoria: 'Sab',
  Pregacao:  'Preg',
  Zelo:      'Zelo',
  Dominio:   'Dom',
};

export function EnergyChip({ tipo, small }: { tipo: EnergyType; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${
        small ? 'w-4 h-4 text-[9px]' : 'w-6 h-6 text-[11px]'
      } font-bold rounded-full ${ENERGY_COLOR[tipo]} shadow-sm`}
      title={tipo}
    >
      {ENERGY_LABEL[tipo]}
    </span>
  );
}

interface CardProps {
  def: CardDef;
  instance?: CardInstance;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  faded?: boolean;
  onClick?: () => void;
  onAttackClick?: (idx: number) => void;
  selectedAttackIdx?: number | null;
}

export function Card({ def, instance, size = 'md', selected, faded, onClick, onAttackClick, selectedAttackIdx }: CardProps) {
  const dims = size === 'sm' ? 'w-28 h-40 text-[10px]' : size === 'lg' ? 'w-52 h-80 text-sm' : 'w-40 h-60 text-xs';
  const colors = def.faccao ? FACCAO_COLORS[def.faccao] : {
    bg: 'bg-stone-50', border: 'border-stone-400', text: 'text-stone-900', ribbon: 'bg-stone-500',
  };
  const baseStyle = `relative ${dims} ${colors.bg} ${colors.text} border-2 ${colors.border}
    rounded-md shadow-md overflow-hidden flex flex-col cursor-pointer
    transition-all hover:shadow-lg hover:-translate-y-0.5`;
  const ring = selected ? 'ring-4 ring-amber-400' : '';
  const fade = faded ? 'opacity-60 grayscale' : '';

  if (def.tipo === 'Energia') {
    return (
      <div className={`${baseStyle} ${ring} ${fade} items-center justify-center`} onClick={onClick}>
        <div className="absolute top-2 left-2 right-2 font-serif font-bold text-center truncate">{def.nome}</div>
        {def.fornecesEnergia && <EnergyChip tipo={def.fornecesEnergia} />}
        <div className="absolute bottom-2 left-2 right-2 text-[9px] italic text-center text-stone-600 line-clamp-2">{def.flavor}</div>
      </div>
    );
  }

  if (def.tipo === 'Evento' || def.tipo === 'Estrutura') {
    return (
      <div className={`${baseStyle} ${ring} ${fade} px-2 py-1.5`} onClick={onClick}>
        <div className="flex justify-between items-start gap-1">
          <span className="font-serif font-bold leading-tight">{def.nome}</span>
          <span className="text-[10px] uppercase tracking-wide bg-stone-200 px-1 rounded">
            {def.tipo === 'Evento' ? def.subtipo ?? 'Ev' : 'Estr'}
          </span>
        </div>
        <div className={`h-1 w-full my-1 rounded ${colors.ribbon}`} />
        <p className="text-[10px] leading-snug flex-1 overflow-hidden">{def.efeitoTexto}</p>
        <p className="text-[9px] italic text-stone-500 line-clamp-2 mt-1">{def.flavor}</p>
      </div>
    );
  }

  // Fiel / Adversario
  const hpMax = def.hp ?? 0;
  const hpAtual = instance?.hpRestante ?? hpMax;
  const hpBonus = instance?.hpMaximoBonus ?? 0;
  return (
    <div className={`${baseStyle} ${ring} ${fade} px-2 py-1.5`} onClick={onClick}>
      <div className="flex justify-between items-start gap-1">
        <span className="font-serif font-bold leading-tight">{def.nome}</span>
        <span className="font-sans font-bold text-rose-700 whitespace-nowrap">
          HP {hpAtual}/{hpMax + hpBonus}
        </span>
      </div>
      <div className={`h-1 w-full my-1 rounded ${colors.ribbon}`} />
      <div className="flex flex-wrap gap-1 items-center text-[9px] uppercase tracking-wide">
        <span>{def.faccao}</span>
        {def.tags.map((t) => (
          <span key={t} className="bg-stone-200 px-1 rounded">{t}</span>
        ))}
        {def.evolucaoDe && <span className="bg-amber-200 px-1 rounded">Promovido</span>}
      </div>

      {instance && instance.energiasAnexadas.length > 0 && (
        <div className="flex gap-0.5 mt-1 flex-wrap">
          {instance.energiasAnexadas.map((e, i) => <EnergyChip key={i} tipo={e} small />)}
        </div>
      )}

      <div className="flex-1 mt-1 space-y-1 overflow-hidden">
        {def.ataques?.map((a, i) => {
          const isSelected = selectedAttackIdx === i;
          return (
            <div
              key={i}
              onClick={onAttackClick ? (e) => { e.stopPropagation(); onAttackClick(i); } : undefined}
              className={`border-t border-stone-300/60 pt-1 ${onAttackClick ? 'hover:bg-amber-100/60 rounded' : ''}
                          ${isSelected ? 'bg-amber-200/80 ring-2 ring-amber-500 rounded' : ''}`}
            >
              <div className="flex justify-between items-start gap-1">
                <div className="flex items-center gap-1 flex-wrap">
                  {a.custo.map((e, j) => <EnergyChip key={j} tipo={e} small />)}
                  <span className="font-semibold">{a.nome}</span>
                </div>
                <span className="font-bold">{a.dano > 0 ? a.dano : '—'}</span>
              </div>
              {a.texto && <div className="text-[9px] italic text-stone-600 leading-tight">{a.texto}</div>}
            </div>
          );
        })}
      </div>

      {def.efeitoTexto && (
        <p className="text-[9px] text-stone-700 leading-tight mt-1 border-t border-stone-300/60 pt-1">
          {def.efeitoTexto}
        </p>
      )}

      <div className="flex justify-between items-end mt-1">
        <span className="text-[9px] italic text-stone-500 line-clamp-2 flex-1 pr-1">{def.flavor}</span>
        {def.retirada !== undefined && (
          <span className="text-[9px] whitespace-nowrap">Ret: {def.retirada}</span>
        )}
      </div>

      {instance?.estados && instance.estados.length > 0 && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          {instance.estados.map((e) => (
            <span key={e} className="text-[8px] bg-rose-700 text-white px-1 rounded shadow">{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'w-28 h-40' : size === 'lg' ? 'w-52 h-80' : 'w-40 h-60';
  return (
    <div className={`${dims} relative rounded-md overflow-hidden border-2 border-amber-700/40 shadow-md`}>
      <div className="absolute inset-0 bg-gradient-to-br from-biblia-capa via-biblia-capaEscura to-biblia-capa" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 6px)',
        }}
      />
      <div className="absolute inset-2 border border-biblia-dourado/60 rounded-sm" />
      <div className="absolute inset-3 border border-biblia-dourado/30 rounded-sm" />

      <div className="absolute inset-0 flex flex-col items-center justify-between py-4">
        <div className="text-center text-biblia-dourado">
          <div className="font-serif text-[9px] tracking-[0.18em] uppercase opacity-90">
            Tradução do
          </div>
          <div className="font-serif text-[11px] font-bold tracking-[0.2em] uppercase">
            Novo Mundo
          </div>
          <div className="font-serif text-[7px] tracking-[0.2em] uppercase opacity-70 mt-0.5">
            das Escrituras Sagradas
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div
            className="font-serif text-biblia-douradoBrilho"
            style={{
              fontSize: size === 'sm' ? '32px' : size === 'lg' ? '64px' : '48px',
              direction: 'rtl',
              textShadow: '0 0 12px rgba(232, 198, 106, 0.4)',
              letterSpacing: '2px',
            }}
            aria-label="Tetragrama YHWH"
          >
            יהוה
          </div>
          <div className="font-serif text-[8px] text-biblia-dourado/80 mt-1 tracking-widest">
            JEOVÁ
          </div>
        </div>

        <div className="text-center text-biblia-dourado/70 text-[7px] tracking-widest uppercase font-serif italic">
          Edição Portugal
        </div>
      </div>
    </div>
  );
}
