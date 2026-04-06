import { useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { TOKEN_SYMBOL } from '../web3';
import type { OnChainPlan } from '../web3';

interface StakePageProps {
  walletBalance: number;
  plans: OnChainPlan[];
  onStake: (amount: number, planIndex: number) => void;
}

export function StakePage({ walletBalance, plans, onStake }: StakePageProps) {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [amount, setAmount] = useState('');

  const plan = plans[selectedPlan];

  const estimatedReward =
    plan && amount
      ? (parseFloat(amount) * plan.apr * plan.days) / (365 * 100)
      : 0;

  const lockEndDate = new Date();
  if (plan) lockEndDate.setDate(lockEndDate.getDate() + plan.days);

  const handleStake = () => {
    if (amount && parseFloat(amount) > 0) {
      onStake(parseFloat(amount), selectedPlan);
      setAmount('');
    }
  };

  if (plans.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Stake Your Tokens</h1>
          <p className="text-muted-foreground">No staking plans available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Stake Your Tokens</h1>
        <p className="text-muted-foreground">Choose a plan and stake to start earning rewards</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl mb-4">Select Plan</h2>
          <div className="grid grid-cols-2 gap-4">
            {plans.map((p, index) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(index)}
                className={`bg-surface border-2 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  selectedPlan === index
                    ? 'border-accent shadow-lg shadow-accent/20'
                    : 'border-border'
                }`}
              >
                <div className="mb-3">
                  <Badge type="apr">{p.apr}% APR</Badge>
                </div>
                <p className="text-2xl mb-2">{p.days} Days</p>
                <p className="text-sm text-muted-foreground">
                  Early penalty: <span className="text-warning">{p.penalty}%</span>
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl mb-6">Stake Amount</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm">Amount</label>
                <span className="text-sm text-muted-foreground">
                  Balance: {walletBalance.toLocaleString()} {TOKEN_SYMBOL}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-20"
                />
                <button
                  onClick={() => setAmount(walletBalance.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-accent text-white rounded text-sm hover:bg-accent-hover transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp size={16} />
                  Estimated Reward
                </span>
                <span className="text-success">
                  +{estimatedReward.toFixed(4)} {TOKEN_SYMBOL}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={16} />
                  Lock End Date
                </span>
                <span>{lockEndDate.toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Total at Maturity</span>
                <span className="text-lg">
                  {(parseFloat(amount || '0') + estimatedReward).toFixed(4)} {TOKEN_SYMBOL}
                </span>
              </div>
            </div>

            <Button
              onClick={handleStake}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance}
              className="w-full"
            >
              Confirm Stake
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
