/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string;
  readonly VITE_STAKING_PROXY_ADDRESS: string;
  readonly VITE_TOKEN_ADDRESS: string;
  readonly VITE_TOKEN_SYMBOL: string;
  readonly VITE_TOKEN_DECIMALS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window to include ethereum (MetaMask)
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  };
}
