import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  title: string;
  price: number | string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonLabel: string;
}

export default function PricingCard({
  title,
  price,
  period,
  description,
  features,
  highlighted,
  buttonLabel,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'rounded-[17px] p-8 pb-9',
        highlighted
          ? 'bg-[#111118] border-2 border-[rgba(201,168,76,0.50)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
          : 'bg-[#111118] border border-[rgba(245,240,232,0.06)]'
      )}
    >
      {highlighted && (
        <div className="inline-flex items-center gap-1.5 bg-[#C9A84C] text-[#0A0A0F] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
          <span className="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-pulse" />
          Хамгийн алдартай
        </div>
      )}

      <h3 className="font-display text-[22px] font-bold mb-2">{title}</h3>
      <p className="text-[#7A7570] text-sm mb-6">{description}</p>

      <div className="mb-7">
        <span className="font-display text-[42px] font-black text-[#C9A84C] leading-none">
          {price}
        </span>
        {typeof price === 'number' && (
          <span className="text-[#7A7570] text-sm ml-1.5">{period || '/сар'}</span>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feat, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-[rgba(245,240,232,0.80)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <circle cx="8" cy="8" r="7.5" stroke="#C9A84C" strokeWidth="1" />
              <path
                d="M5 8l2 2 4-4"
                stroke="#C9A84C"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feat}
          </li>
        ))}
      </ul>

      <Button variant={highlighted ? 'primary' : 'outline'} size="md" className="w-full">
        {buttonLabel}
      </Button>
    </div>
  );
}
