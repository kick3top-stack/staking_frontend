# StakeVault — Frontend

A React + Vite frontend for the StakeVault ERC-20 staking protocol. Connects to a UUPS upgradeable staking contract deployed on any EVM network.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** + **shadcn/ui** — styling
- **ethers v6** — blockchain interaction
- **MetaMask** — wallet connection

## Features

- Connect MetaMask wallet
- View live staking plans loaded from the contract
- Stake tokens (ERC-20 approve + createStake in one flow)
- View and unstake active positions with real-time pending rewards
- Dashboard with on-chain TVL, reward pool balance, staker count, and plan count
- Admin panel for contract owner — deposit rewards, pause/unpause, add plans

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Set the required environment variables before running:

```powershell
$env:VITE_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
$env:VITE_STAKING_PROXY_ADDRESS="0x..."
$env:VITE_TOKEN_ADDRESS="0x..."
$env:VITE_TOKEN_SYMBOL="MOCK"
$env:VITE_TOKEN_DECIMALS="18"
```

### 3. Run dev server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

## Contract Integration

The frontend reads from and writes to the staking contract via `src/app/web3.ts`.

| Action | Contract function |
|---|---|
| Stake | `approve` + `createStake(planId, amount)` |
| Unstake | `unstake(stakeId)` |
| Deposit rewards | `approve` + `depositRewards(amount)` |
| Pause / Unpause | `pause()` / `unpause()` |
| Add plan | `addPlan(days, apr, penalty)` |

Read-only calls (plans, stakes, balances) use a `JsonRpcProvider` with `VITE_RPC_URL` — no wallet required for viewing data.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_RPC_URL` | JSON-RPC endpoint for read-only calls |
| `VITE_STAKING_PROXY_ADDRESS` | Deployed proxy contract address |
| `VITE_TOKEN_ADDRESS` | ERC-20 staking token address |
| `VITE_TOKEN_SYMBOL` | Token symbol displayed in the UI |
| `VITE_TOKEN_DECIMALS` | Token decimals (default: 18) |

## Notes

- The smart contract source and deployment scripts live in a separate workspace.
- Admin functions (deposit rewards, pause, add plan) require the connected wallet to be the contract owner.
- `addPlan` and `depositRewards` require the contract to be **paused** first.
