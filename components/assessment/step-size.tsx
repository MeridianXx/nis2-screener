import { Input } from '@/components/ui/input';

type Props = {
  employees: string;
  turnover: string;
  balance: string;
  onChange: (patch: { employees?: string; turnover?: string; balance?: string }) => void;
};

export function StepSize({ employees, turnover, balance, onChange }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] leading-tight text-ink">Hur stort är företaget?</h2>
        <p className="text-[15px] text-mid">
          Cybersäkerhetslagen följer EU:s SMF-definition: minst ett av talen avgör om ni
          räknas som medelstort eller stort. Hoppa över fält ni inte har siffror på.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Antal anställda"
          inputMode="numeric"
          placeholder="120"
          value={employees}
          onChange={(e) => onChange({ employees: e.target.value })}
          hint="Heltidsekvivalenter"
        />
        <Input
          label="Årsomsättning"
          inputMode="decimal"
          placeholder="25"
          value={turnover}
          onChange={(e) => onChange({ turnover: e.target.value })}
          suffix="MEUR"
          hint="Senaste räkenskapsår"
        />
        <Input
          label="Balansomslutning"
          inputMode="decimal"
          placeholder="18"
          value={balance}
          onChange={(e) => onChange({ balance: e.target.value })}
          suffix="MEUR"
          hint="Tillgångar i balansräkningen"
        />
      </div>
    </div>
  );
}
