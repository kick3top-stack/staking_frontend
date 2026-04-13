import { BrowserProvider } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL ?? '';

async function fetchWithTimeout(url: string, options: RequestInit, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error(`Request timed out after ${ms / 1000}s`);
    throw new Error(`Network error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function login(address: string): Promise<string> {
  if (!API_URL) throw new Error('VITE_API_URL is not configured');

  // 1. Get nonce
  const nonceRes = await fetchWithTimeout(`${API_URL}/api/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!nonceRes.ok) {
    const body = await nonceRes.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Nonce request failed (${nonceRes.status})`);
  }
  const { nonce } = await nonceRes.json() as { nonce: string };

  // 2. Build message
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

  // 3. Sign — triggers MetaMask popup
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  // 4. Verify → get JWT
  const verifyRes = await fetchWithTimeout(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  if (!verifyRes.ok) {
    const body = await verifyRes.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Verification failed (${verifyRes.status})`);
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

  const res = await fetchWithTimeout(`${API_URL}/api/history/${address}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) throw new Error(`History request failed (${res.status})`);

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
