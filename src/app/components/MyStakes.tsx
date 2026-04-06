import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { TOKEN_SYMBOL } from '../web3';
import type { OnChainStake } from '../web3';

interface MyStakesProps {
  stakes: OnChainStake[];
  onUnstake: (stakeId: number) => void;
}

export function MyStakes({ stakes, onUnstake }: MyStakesProps) {
  const [unstakeModal, setUnstakeModal] = useState<{ show: boolean; stake: OnChainStake | null }>({
    show: false,
    stake: null,
  });

  const handleUnstakeClick = (stake: OnChainStake) => setUnstakeModal({ show: true, stake });

  const handleConfirmUnstake = () => {
    if (unstakeModal.stake) {
      onUnstake(unstakeModal.stake.id);
      setUnstakeModal({ show: false, stake: null });
    }
  };

  const isPenalty = unstakeModal.stake?.status === 'active';

  const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">My Stakes</h1>
        <p className="text-muted-foreground">Manage your active staking positions</p>
      </div>

      {stakes.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Inbox className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-xl mb-2">No active stakes</h3>
          <p className="text-muted-foreground mb-6">You don't have any staking positions yet</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">ID</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Amount</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">APR</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Start</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">End</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Pending Reward</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {stakes.map((stake) => (
                  <tr key={stake.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">#{stake.id}</td>
                    <td className="px-6 py-4">{stake.amount.toLocaleString()} {TOKEN_SYMBOL}</td>
                    <td className="px-6 py-4"><Badge type="apr">{stake.apr}%</Badge></td>
                    <td className="px-6 py-4 text-muted-foreground">{fmtDate(stake.startTime)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{fmtDate(stake.endTime)}</td>
                    <td className="px-6 py-4 text-success">+{stake.pendingReward.toFixed(4)} {TOKEN_SYMBOL}</td>
                    <td className="px-6 py-4">
                      <Badge type={stake.status === 'active' ? 'active' : 'matured'}>
                        {stake.status === 'active' ? 'Active' : 'Matured'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant={stake.status === 'active' ? 'secondary' : 'primary'}
                        onClick={() => handleUnstakeClick(stake)}
                        className="text-sm py-2 px-4"
                      >
                        Unstake
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {stakes.map((stake) => (
              <div key={stake.id} className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl">Stake #{stake.id}</span>
                  <Badge type={stake.status === 'active' ? 'active' : 'matured'}>
                    {stake.status === 'active' ? 'Active' : 'Matured'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Amount</p>
                    <p>{stake.amount.toLocaleString()} {TOKEN_SYMBOL}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">APR</p>
                    <Badge type="apr">{stake.apr}%</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Start</p>
                    <p>{fmtDate(stake.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">End</p>
                    <p>{fmtDate(stake.endTime)}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Pending Reward</span>
                    <span className="text-success text-lg">+{stake.pendingReward.toFixed(4)} {TOKEN_SYMBOL}</span>
                  </div>
                  <Button
                    variant={stake.status === 'active' ? 'secondary' : 'primary'}
                    onClick={() => handleUnstakeClick(stake)}
                    className="w-full"
                  >
                    Unstake
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={unstakeModal.show}
        onClose={() => setUnstakeModal({ show: false, stake: null })}
        title="Confirm Unstake"
        onConfirm={handleConfirmUnstake}
        confirmText="Confirm Unstake"
        confirmVariant={isPenalty ? 'danger' : 'primary'}
      >
        {unstakeModal.stake && (
          <div className="space-y-4">
            {isPenalty ? (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <p className="text-error mb-2">⚠️ Early Unstake Penalty</p>
                <p className="text-sm text-muted-foreground">
                  Unstaking before the lock period ends will incur a {unstakeModal.stake.penalty}% penalty on your reward.
                </p>
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-success mb-2">✓ No Penalty</p>
                <p className="text-sm text-muted-foreground">
                  Your stake has matured. You can withdraw without any penalty.
                </p>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staked Amount</span>
                <span>{unstakeModal.stake.amount.toLocaleString()} {TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Reward</span>
                <span className="text-success">+{unstakeModal.stake.pendingReward.toFixed(4)} {TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span>You will receive</span>
                <span className="text-lg">
                  {(unstakeModal.stake.amount + unstakeModal.stake.pendingReward).toFixed(4)} {TOKEN_SYMBOL}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
