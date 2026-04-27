import { Checkbox } from '@/components/ui/checkbox';
import { SPECIALS } from '@/lib/assess';

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
};

const OPTIONS = [
  {
    key: SPECIALS.PUBLIC,
    label: 'Offentlig aktör',
    description: 'Kommun, region, statlig myndighet eller motsvarande.',
  },
  {
    key: SPECIALS.CER,
    label: 'CER-status',
    description:
      'Verksamheten är utpekad som kritisk entitet enligt CER-direktivet (kontakta MCF om ni är osäkra).',
  },
  {
    key: SPECIALS.DNS_TRUST,
    label: 'DNS-tjänst, toppdomänregister eller kvalificerad betrodd tjänst',
    description: 'Tillhandahåller eIDAS-tjänster eller central namnupplösning.',
  },
  {
    key: SPECIALS.SOLE_PROVIDER,
    label: 'Ensam leverantör i sektorn',
    description:
      'Ni är den enda eller en av få aktörer som tillhandahåller en specifik tjänst i Sverige.',
  },
  {
    key: SPECIALS.SUPPLIER_TO,
    label: 'Leverantör till en omfattad verksamhet',
    description:
      'En kund eller motpart som omfattas av cybersäkerhetslagen ställer säkerhetskrav på er.',
  },
  {
    key: SPECIALS.ONLY_SECURITY_PROTECTION,
    label: 'Verksamhet enbart inom säkerhetsskyddslagen',
    description:
      'All verksamhet bedrivs under säkerhetsskyddslagens tillämpningsområde — undantag från cybersäkerhetslagen.',
  },
] as const;

export function StepSpecials({ values, onChange }: Props) {
  const set = new Set(values);

  const toggle = (key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] leading-tight text-ink">Något särskilt vi bör veta?</h2>
        <p className="text-[15px] text-mid">
          Vissa förhållanden överstyr storleksreglerna. Kryssa i det som stämmer — flera
          val är möjliga.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <Checkbox
            key={opt.key}
            checked={set.has(opt.key)}
            onChange={() => toggle(opt.key)}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
    </div>
  );
}
