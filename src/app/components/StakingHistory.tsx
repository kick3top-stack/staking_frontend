import { useEffect, useState } from 'react';
import { ExternalLink, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { fetchHistory, type StakeCreatedEvent, type UnstakedEvent } from '../auth';
import { TOKEN_SYMBOL, TOKEN_DECIMALS } from '../web3';
import { formatUnits } from 'ethers';

interface StakingHistoryProps {
  address: string;
}

type HistoryItem =
  | { type: 'stake'; data: StakeCreatedEvent }
  | { type: 'unstake'; data: UnstakedEvent };

const EXPLORER = 'https://sepolia.etherscan.io/tx/';

export function StakingHistory({ address }: StakingHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory(address)
      .then(({ stakeCreateds, unstakeds }) => {
        const merged: HistoryItem[] = [
          ...stakeCreateds.map((d) => ({ type: 'stake' as const, data: d })),
          ...unstakeds.map((d) => ({ type: 'unstake' as const, data: d })),
        ].sort((a, b) => {
          const tsA = Number(a.data.blockTimestamp);
          const tsB = Number(b.data.blockTimestamp);
          return tsB - tsA;
        });
        setItems(merged);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  const fmt = (raw: string) =>
    parseFloat(formatUnits(BigInt(raw), TOKEN_DECIMALS)).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });

  const fmtDate = (ts: string) =>
    new Date(Number(ts) * 1000).toLocaleString();

  const shortHash = (hash: string) =>
    `${hash.slice(0, 8)}…${hash.slice(-6)}`;

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Staking History</h1>
          <p className="text-muted-foreground">Loading your on-chain history…</p>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Staking History</h1>
        </div>
        <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Staking History</h1>
        <p className="text-muted-foreground">All your on-chain staking activity</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No staking history found for this wallet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Type</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Stake ID</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Amount</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Reward</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-sm text-muted-foreground">Tx</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.data.id}
                    className="border-b border-border last:border-0 hover:bg-background transition-colors"
                  >
                    <td className="px-6 py-4">
                      {item.type === 'stake' ? (
                        <span className="flex items-center gap-2 text-accent">
                          <ArrowDownCircle size={16} /> Staked
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-success">
                          <ArrowUpCircle size={16} /> Unstaked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">#{item.data.stakeId}</td>
                    <td className="px-6 py-4">
                      {fmt(item.data.amount)} {TOKEN_SYMBOL}
                    </td>
                    <td className="px-6 py-4 text-success">
                      {item.type === 'unstake'
                        ? `+${fmt((item.data as UnstakedEvent).reward)} ${TOKEN_SYMBOL}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {fmtDate(item.data.blockTimestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`${EXPLORER}${item.data.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-accent hover:underline text-sm"
                      >
                        {shortHash(item.data.transactionHash)}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {items.map((item) => (
              <div
                key={item.data.id}
                className="bg-surface border border-border rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  {item.type === 'stake' ? (
                    <span className="flex items-center gap-2 text-accent">
                      <ArrowDownCircle size={16} /> Staked
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-success">
                      <ArrowUpCircle size={16} /> Unstaked
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">#{item.data.stakeId}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Amount</p>
                    <p>{fmt(item.data.amount)} {TOKEN_SYMBOL}</p>
                  </div>
                  {item.type === 'unstake' && (
                    <div>
                      <p className="text-muted-foreground mb-1">Reward</p>
                      <p className="text-success">+{fmt((item.data as UnstakedEvent).reward)} {TOKEN_SYMBOL}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Date</p>
                    <p>{fmtDate(item.data.blockTimestamp)}</p>
                  </div>
                </div>
                <a
                  href={`${EXPLORER}${item.data.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent hover:underline text-sm"
                >
                  {shortHash(item.data.transactionHash)}
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
