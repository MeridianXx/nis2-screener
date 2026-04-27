import { sectorsByBilaga, type SectorDef } from '@/lib/sectors';

type Props = {
  value: string | null;
  onChange: (key: string | null) => void;
};

const NONE_KEY = 'none';

export function StepSector({ value, onChange }: Props) {
  const bilaga1 = sectorsByBilaga(1);
  const bilaga2 = sectorsByBilaga(2);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] leading-tight text-ink">Vilken sektor är ni i?</h2>
        <p className="text-[15px] text-mid">
          Välj den sektor som bäst beskriver er huvudsakliga verksamhet. Om ni är osäkra
          på om ni hamnar inom en sektor — välj &quot;ingen av dessa&quot; så hjälper vi
          er ändå med en bedömning.
        </p>
      </div>

      <SectorGroup
        title="Bilaga 1 — sektorer med högsta kritikalitet"
        sectors={bilaga1}
        value={value}
        onChange={onChange}
      />
      <SectorGroup
        title="Bilaga 2 — övriga kritiska sektorer"
        sectors={bilaga2}
        value={value}
        onChange={onChange}
      />

      <SectorOption
        sector={{ key: NONE_KEY, label: 'Ingen av dessa', bilaga: 1 }}
        selected={value === NONE_KEY}
        onSelect={() => onChange(NONE_KEY)}
        muted
      />
    </div>
  );
}

type GroupProps = {
  title: string;
  sectors: SectorDef[];
  value: string | null;
  onChange: (key: string) => void;
};

function SectorGroup({ title, sectors, value, onChange }: GroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-mid">{title}</p>
      <div className="grid auto-rows-fr gap-2 sm:grid-cols-2">
        {sectors.map((sector) => (
          <SectorOption
            key={sector.key}
            sector={sector}
            selected={value === sector.key}
            onSelect={() => onChange(sector.key)}
          />
        ))}
      </div>
    </div>
  );
}

type OptionProps = {
  sector: SectorDef;
  selected: boolean;
  onSelect: () => void;
  muted?: boolean;
};

function SectorOption({ sector, selected, onSelect, muted }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full flex-col gap-1 rounded-xl border bg-white px-4 py-3 text-left transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime ${
        selected ? 'border-deep' : 'border-border hover:border-mid'
      }`}
    >
      <span className={`text-[15px] font-medium ${muted ? 'text-mid' : 'text-ink'}`}>
        {sector.label}
      </span>
      {sector.examples ? (
        <span className="text-[13px] text-mid">{sector.examples}</span>
      ) : null}
    </button>
  );
}

export const NONE_SECTOR_KEY = NONE_KEY;
