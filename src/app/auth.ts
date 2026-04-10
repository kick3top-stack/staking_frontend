import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function login(address: string): Promise<string> {
  // 1. Get nonce from backend
  const nonceRes = await fetch(`${API_URL}/api/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  const { nonce } = await nonceRes.json() as { nonce: string };

  // 2. Build SIWE message
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  const message = new SiweMessage({
    domain: window.location.host,
    address,
    statement: 'Sign in to StakeVault',
    uri: window.location.origin,
    version: '1',
    chainId: Number(network.chainId),
    nonce,
  });
  const preparedMessage = message.prepareMessage();

  // 3. Sign with wallet
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(preparedMessage);

  // 4. Verify on backend → get JWT
  const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: preparedMessage, signature }),
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
