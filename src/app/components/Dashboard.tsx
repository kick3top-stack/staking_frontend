import { TrendingUp, Users, Layers, Coins } from 'lucide-react';
import { Button } from './Button';
import { TOKEN_SYMBOL } from '../web3';
import type { DashboardStats } from '../web3';

interface DashboardProps {
  onNavigate: (page: string) => void;
  stats: DashboardStats | null;
  planCount: number;
}

export function Dashboard({ onNavigate, stats, planCount }: DashboardProps) {
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const cards = [
    {
      icon: <Coins className="text-accent" size={24} />,
      label: 'Total Value Locked',
      value: stats ? `${fmt(stats.tvl)} ${TOKEN_SYMBOL}` : '—',
    },
    {
      icon: <Users className="text-success" size={24} />,
      label: 'Total Stakers',
      value: stats?.totalStakers != null ? String(stats.totalStakers) : '—',
    },
    {
      icon: <Layers className="text-warning" size={24} />,
      label: 'Available Plans',
      value: planCount > 0 ? String(planCount) : '—',
    },
    {
      icon: <TrendingUp className="text-accent" size={24} />,
      label: 'Reward Pool Balance',
      value: stats ? `${fmt(stats.rewardPoolBalance)} ${TOKEN_SYMBOL}` : '—',
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="mb-12 text-center">
        <h1 className="text-5xl mb-4">Welcome to StakeVault</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Stake your tokens and earn competitive rewards with flexible lock periods
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-background rounded-lg">{card.icon}</div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{card.label}</p>
            <p className="text-3xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={() => onNavigate('stake')} className="px-8 py-4 text-lg">
          Start Staking
        </Button>
      </div>
    </div>
  );
}
