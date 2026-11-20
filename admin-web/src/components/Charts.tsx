import React from 'react';

interface BarItem {
  label: string;
  value: number;
  color: string;
}

export const ModalityBarChart: React.FC<{ items: BarItem[]; max?: number }> = ({
  items,
  max = 100,
}) => {
  return (
    <div className="flex items-end justify-around gap-4 h-48 pt-4 px-2">
      {items.map((item) => {
        const pct = Math.max(4, Math.min(100, (item.value / max) * 100));
        return (
          <div key={item.label} className="flex flex-col items-center flex-1 h-full justify-end gap-2">
            <span className="text-xs font-bold text-[#39245F]">{item.value}%</span>
            <div className="w-full max-w-[54px] bg-[#F3EEFC] rounded-t-xl h-32 flex items-end overflow-hidden">
              <div
                className="w-full rounded-t-xl transition-all duration-500"
                style={{ height: `${pct}%`, backgroundColor: item.color }}
              />
            </div>
            <span className="text-xs font-semibold text-[#64587A] text-center">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export const ComparisonRowChart: React.FC<{
  label: string;
  previous: number;
  latest: number;
  color: string;
}> = ({ label, previous, latest, color }) => {
  const delta = latest - previous;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-[#24163D]">{label}</span>
        <span className="font-bold text-[#39245F]">
          {previous}% → {latest}%{' '}
          <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            ({delta >= 0 ? `+${delta}` : delta}%)
          </span>
        </span>
      </div>
      <div className="h-3 bg-[#F3EEFC] rounded-full overflow-hidden flex flex-col justify-center relative">
        <div
          className="h-full rounded-full opacity-35 absolute left-0 top-0"
          style={{ width: `${previous}%`, backgroundColor: color }}
        />
        <div
          className="h-2 rounded-full relative z-10"
          style={{ width: `${latest}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
