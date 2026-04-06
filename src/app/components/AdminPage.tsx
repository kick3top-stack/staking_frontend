import { useState } from 'react';
import { Copy, Check, AlertCircle, Plus, Edit2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { TOKEN_SYMBOL } from '../web3';

interface AdminPageProps {
  isAdmin: boolean;
  contractInfo: {
    proxyAddress: string;
    implementationAddress: string;
    ownerAddress: string;
    rewardPoolBalance: number;
    isPaused: boolean;
  };
  plans: Array<{ id: number; days: number; apr: number; penalty: number }>;
  onDepositRewards: (amount: number) => void;
  onTogglePause: () => void;
  onAddPlan: (days: number, apr: number, penalty: number) => void;
}

export function AdminPage({
  isAdmin,
  contractInfo,
  plans,
  onDepositRewards,
  onTogglePause,
  onAddPlan
}: AdminPageProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pauseModal, setPauseModal] = useState(false);
  const [newPlan, setNewPlan] = useState({ days: '', apr: '', penalty: '' });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeposit = () => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      onDepositRewards(parseFloat(depositAmount));
      setDepositAmount('');
    }
  };

  const handleAddPlan = () => {
    const { days, apr, penalty } = newPlan;
    if (days && apr && penalty) {
      onAddPlan(parseInt(days), parseFloat(apr), parseFloat(penalty));
      setNewPlan({ days: '', apr: '', penalty: '' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="bg-surface border border-error rounded-xl p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-error" size={48} />
          <h2 className="text-2xl mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            This page is only accessible to the contract owner
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage staking protocol settings</p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl mb-4">Reward Pool</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className="text-3xl">
                  {contractInfo.rewardPoolBalance.toLocaleString()} {TOKEN_SYMBOL}
                </p>
              </div>
              <Input
                type="number"
                placeholder="Amount to deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                label="Deposit Amount"
              />
            </div>
            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || parseFloat(depositAmount) <= 0}
            >
              Deposit
            </Button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">Staking Plans</h2>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-muted-foreground">Lock Period</th>
                  <th className="px-4 py-3 text-left text-sm text-muted-foreground">APR</th>
                  <th className="px-4 py-3 text-left text-sm text-muted-foreground">Early Penalty</th>
                  <th className="px-4 py-3 text-left text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4">{plan.days} Days</td>
                    <td className="px-4 py-4">
                      <Badge type="apr">{plan.apr}%</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge type="penalty">{plan.penalty}%</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <button className="p-2 hover:bg-background rounded transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-background rounded-lg p-4">
            <p className="mb-4 flex items-center gap-2">
              <Plus size={20} className="text-accent" />
              Add New Plan
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                type="number"
                placeholder="Days"
                value={newPlan.days}
                onChange={(e) => setNewPlan({ ...newPlan, days: e.target.value })}
                label="Lock Period"
              />
              <Input
                type="number"
                placeholder="APR %"
                value={newPlan.apr}
                onChange={(e) => setNewPlan({ ...newPlan, apr: e.target.value })}
                label="APR"
              />
              <Input
                type="number"
                placeholder="Penalty %"
                value={newPlan.penalty}
                onChange={(e) => setNewPlan({ ...newPlan, penalty: e.target.value })}
                label="Early Penalty"
              />
              <div className="flex items-end">
                <Button
                  onClick={handleAddPlan}
                  disabled={!newPlan.days || !newPlan.apr || !newPlan.penalty}
                  className="w-full"
                >
                  Add Plan
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl mb-4">Contract Control</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2">Contract Status</p>
              <Badge type={contractInfo.isPaused ? 'paused' : 'active'}>
                {contractInfo.isPaused ? 'Paused' : 'Live'}
              </Badge>
            </div>
            <Button
              variant={contractInfo.isPaused ? 'primary' : 'danger'}
              onClick={() => setPauseModal(true)}
            >
              {contractInfo.isPaused ? 'Unpause Contract' : 'Pause Contract'}
            </Button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl mb-4">Contract Information</h2>
          <div className="space-y-4">
            {[
              { label: 'Proxy Address', value: contractInfo.proxyAddress, field: 'proxy' },
              { label: 'Implementation Address', value: contractInfo.implementationAddress, field: 'impl' },
              { label: 'Owner Address', value: contractInfo.ownerAddress, field: 'owner' }
            ].map(({ label, value, field }) => (
              <div key={field} className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">{label}</p>
                  <p className="font-mono text-sm truncate">{value}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(value, field)}
                  className="ml-4 p-2 hover:bg-surface rounded transition-colors"
                >
                  {copiedField === field ? (
                    <Check className="text-success" size={18} />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={pauseModal}
        onClose={() => setPauseModal(false)}
        title={contractInfo.isPaused ? 'Unpause Contract' : 'Pause Contract'}
        onConfirm={() => {
          onTogglePause();
          setPauseModal(false);
        }}
        confirmText="Confirm"
        confirmVariant="danger"
      >
        <p className="text-muted-foreground">
          {contractInfo.isPaused
            ? 'Are you sure you want to unpause the contract? Users will be able to stake and unstake again.'
            : 'Are you sure you want to pause the contract? Users will not be able to stake or unstake while paused.'}
        </p>
      </Modal>
    </div>
  );
}
