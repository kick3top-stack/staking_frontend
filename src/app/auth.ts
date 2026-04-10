import { BrowserProvider } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function login(address: string): Promise<string> {
  // 1. Get nonce from backend
  const nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });

  if (!nonceRes.ok) throw new Error('Failed to get nonce');
  const { nonce } = await nonceRes.json() as { nonce: string };

  // 2. Build SIWE message manually (no siwe package needed on frontend)
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const issuedAt = new Date().toISOString();

  const message = [
    `${window.location.host} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to StakeVault',
    '',
    `URI: ${window.location.origin}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');

  // 3. Sign with wallet — this triggers MetaMask popup
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  // 4. Verify on backend → get JWT
  const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json() as { error: string };
    throw new Error(err.error ?? 'Verification failed');
  }

  const { token } = await verifyRes.json() as { token: string };
  localStorage.setItem('staking_jwt', token);
  return token;
}

export function getToken(): string | null {
  return localStorage.getItem('staking_jwt');
}

export function logout() {
  localStorage.removeItem('staking_jwt');
}

export async function fetchHistory(address: string) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/history/${address}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json() as Promise<{
    stakeCreateds: StakeCreatedEvent[];
    unstakeds: UnstakedEvent[];
  }>;
}

export interface StakeCreatedEvent {
  id: string;
  stakeId: string;
  staker: string;
  planId: string;
  amount: string;
  apr: string;
  penalty: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface UnstakedEvent {
  id: string;
  stakeId: string;
  staker: string;
  amount: string;
  reward: string;
  blockTimestamp: string;
  transactionHash: string;
}
