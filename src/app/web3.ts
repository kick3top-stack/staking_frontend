import { BrowserProvider, JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import StakingABI from '../../artifacts/contracts/StakingContract.sol/StakingContract.json';
import MockERC20ABI from '../../artifacts/contracts/mocks/MockERC20.sol/MockERC20.json';

// ── Update these after deploying to your network ──────────────────────────────
export const STAKING_PROXY_ADDRESS = import.meta.env.VITE_STAKING_PROXY_ADDRESS ?? '';
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS ?? '';
export const TOKEN_SYMBOL = import.meta.env.VITE_TOKEN_SYMBOL ?? 'MOCK';
export const TOKEN_DECIMALS = Number(import.meta.env.VITE_TOKEN_DECIMALS ?? 18);
// RPC used for read-only calls (no wallet required)
export const RPC_URL = import.meta.env.VITE_RPC_URL ?? 'http://127.0.0.1:8545';
// ─────────────────────────────────────────────────────────────────────────────

/** Read-only provider — works without MetaMask */
export function getReadProvider() {
  return new JsonRpcProvider(RPC_URL);
}

/** Wallet provider — requires MetaMask */
export function getWalletProvider() {
  if (!window.ethereum) throw new Error('No wallet detected. Please install MetaMask.');
  return new BrowserProvider(window.ethereum);
}

export async function getSigner() {
  return getWalletProvider().getSigner();
}

export async function getStakingContract(withSigner = false) {
  if (withSigner) {
    return new Contract(STAKING_PROXY_ADDRESS, StakingABI.abi, await getSigner());
  }
  return new Contract(STAKING_PROXY_ADDRESS, StakingABI.abi, getReadProvider());
}

export async function getTokenContract(withSigner = false) {
  if (withSigner) {
    return new Contract(TOKEN_ADDRESS, MockERC20ABI.abi, await getSigner());
  }
  return new Contract(TOKEN_ADDRESS, MockERC20ABI.abi, getReadProvider());
}

/** Returns token balance as a human-readable number */
export async function fetchTokenBalance(address: string): Promise<number> {
  const token = await getTokenContract();
  const raw = await token.balanceOf(address);
  return parseFloat(formatUnits(raw, TOKEN_DECIMALS));
}

export interface OnChainPlan {
  id: number;
  days: number;
  apr: number;
  penalty: number;
}

export interface OnChainStake {
  id: number;
  planId: number;
  amount: number;
  apr: number;
  penalty: number;
  startTime: number;
  endTime: number;
  pendingReward: number;
  status: 'active' | 'matured';
}

/** Fetches all plans by probing IDs in parallel batches until one reverts */
export async function fetchPlans(): Promise<OnChainPlan[]> {
  const contract = await getStakingContract();
  const plans: OnChainPlan[] = [];
  // Probe in batches of 10 until a full batch comes back empty
  let id = 0;
  while (true) {
    const batch = Array.from({ length: 10 }, (_, i) => id + i);
    const results = await Promise.allSettled(batch.map((i) => contract.getPlan(i)));
    let anyFulfilled = false;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        const p = r.value;
        plans.push({
          id: id + i,
          days: Number(p.period) / 86400,
          apr: Number(p.apr),
          penalty: Number(p.penalty),
        });
        anyFulfilled = true;
      }
    }
    if (!anyFulfilled) break;
    id += 10;
  }
  return plans;
}

/** Fetches all stakes for a user address */
export async function fetchUserStakes(address: string): Promise<OnChainStake[]> {
  const contract = await getStakingContract();
  const ids: bigint[] = await contract.getStakeIdsByUser(address);
  const now = Math.floor(Date.now() / 1000);

  return Promise.all(
    ids.map(async (stakeId) => {
      const s = await contract.getStake(stakeId);
      const reward = await contract.pendingReward(stakeId);
      const endTime = Number(s.endTime);
      return {
        id: Number(stakeId),
        planId: Number(s.planId),
        amount: parseFloat(formatUnits(s.amount, TOKEN_DECIMALS)),
        apr: Number(s.apr),
        penalty: Number(s.penalty),
        startTime: Number(s.startTime),
        endTime,
        pendingReward: parseFloat(formatUnits(reward, TOKEN_DECIMALS)),
        status: now >= endTime ? 'matured' : 'active',
      } as OnChainStake;
    })
  );
}

/** Approve + createStake */
export async function txCreateStake(planId: number, amount: number): Promise<void> {
  const token = await getTokenContract(true);
  const staking = await getStakingContract(true);
  const raw = parseUnits(amount.toString(), TOKEN_DECIMALS);

  const approveTx = await token.approve(STAKING_PROXY_ADDRESS, raw);
  await approveTx.wait();

  const stakeTx = await staking.createStake(planId, raw);
  await stakeTx.wait();
}

/** Unstake by stakeId */
export async function txUnstake(stakeId: number): Promise<void> {
  const staking = await getStakingContract(true);
  const tx = await staking.unstake(stakeId);
  await tx.wait();
}

/** Approve + depositRewards (owner only) */
export async function txDepositRewards(amount: number): Promise<void> {
  const token = await getTokenContract(true);
  const staking = await getStakingContract(true);
  const raw = parseUnits(amount.toString(), TOKEN_DECIMALS);

  const approveTx = await token.approve(STAKING_PROXY_ADDRESS, raw);
  await approveTx.wait();

  const tx = await staking.depositRewards(raw);
  await tx.wait();
}

/** Pause contract (owner only) */
export async function txPause(): Promise<void> {
  const staking = await getStakingContract(true);
  const tx = await staking.pause();
  await tx.wait();
}

/** Unpause contract (owner only) */
export async function txUnpause(): Promise<void> {
  const staking = await getStakingContract(true);
  const tx = await staking.unpause();
  await tx.wait();
}

/** Add plan — contract must be paused (owner only) */
export async function txAddPlan(days: number, apr: number, penalty: number): Promise<void> {
  const staking = await getStakingContract(true);
  const tx = await staking.addPlan(days, apr, penalty);
  await tx.wait();
}

/** Fetch contract-level info for admin panel */
export async function fetchContractInfo() {
  const contract = await getStakingContract();
  const token = await getTokenContract();
  const [implAddr, isPaused, ownerAddr, contractBalanceRaw] = await Promise.all([
    contract.implementation(),
    contract.paused(),
    contract.owner(),
    token.balanceOf(STAKING_PROXY_ADDRESS),
  ]);

  // Derive reward pool = contract balance - sum of active stakes
  let tvlRaw = 0n;
  let id = 0;
  while (true) {
    const batch = Array.from({ length: 20 }, (_, i) => id + i);
    const results = await Promise.allSettled(batch.map((i) => contract.getStake(i)));
    let anyFound = false;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.staker !== '0x0000000000000000000000000000000000000000') {
        tvlRaw += r.value.amount;
        anyFound = true;
      }
    }
    if (!anyFound) break;
    id += 20;
  }

  const contractBalance = parseFloat(formatUnits(contractBalanceRaw, TOKEN_DECIMALS));
  const tvl = parseFloat(formatUnits(tvlRaw, TOKEN_DECIMALS));

  return {
    proxyAddress: STAKING_PROXY_ADDRESS,
    implementationAddress: implAddr as string,
    ownerAddress: ownerAddr as string,
    rewardPoolBalance: Math.max(0, contractBalance - tvl),
    isPaused: isPaused as boolean,
  };
}

export interface DashboardStats {
  tvl: number;
  rewardPoolBalance: number;
  totalStakers: number | null;
  planCount: number;
}

/** Fetch stats shown on the dashboard.
 *  TVL = sum of all active stake amounts (probed by ID).
 *  Reward pool = token balance of proxy minus TVL.
 *  Staker count = unique stakers across all active stakes.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const contract = await getStakingContract();
  const token = await getTokenContract();

  const [contractBalanceRaw, plans] = await Promise.all([
    token.balanceOf(STAKING_PROXY_ADDRESS),
    fetchPlans(),
  ]);

  // Probe stake IDs in batches until a full batch returns nothing
  let id = 0;
  let tvlRaw = 0n;
  const stakers = new Set<string>();

  while (true) {
    const batch = Array.from({ length: 20 }, (_, i) => id + i);
    const results = await Promise.allSettled(batch.map((i) => contract.getStake(i)));
    let anyFound = false;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.staker !== '0x0000000000000000000000000000000000000000') {
        tvlRaw += r.value.amount;
        stakers.add((r.value.staker as string).toLowerCase());
        anyFound = true;
      }
    }
    if (!anyFound) break;
    id += 20;
  }

  const tvl = parseFloat(formatUnits(tvlRaw, TOKEN_DECIMALS));
  const contractBalance = parseFloat(formatUnits(contractBalanceRaw, TOKEN_DECIMALS));
  const rewardPoolBalance = Math.max(0, contractBalance - tvl);

  return {
    tvl,
    rewardPoolBalance,
    totalStakers: stakers.size,
    planCount: plans.length,
  };
}
