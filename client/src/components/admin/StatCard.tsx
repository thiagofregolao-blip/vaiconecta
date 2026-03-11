import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
  loading?: boolean;
}

const colors = {
  blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  green: 'text-green-400 bg-green-500/20 border-green-500/30',
  yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  purple: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', loading }: Props) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm">{title}</p>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
      ) : (
        <p className="text-white text-2xl font-bold">{value}</p>
      )}
    </div>
  );
}
