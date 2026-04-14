import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { StakePage } from './components/StakePage';
import { MyStakes } from './components/MyStakes';
import { AdminPage } from './components/AdminPage';
import { StakingHistory } from './components/StakingHistory';
import { HelpPage } from './components/HelpPage';
import { ToastContainer } from './components/ToastContainer';
import { login, logout, getToken } from './auth';
import {
  TOKEN_SYMBOL,
  STAKING_PROXY_ADDRESS,
  fetchTokenBalance,
  fetchPlans,
  fetchUserStakes,
  fetchContractInfo,
  fetchDashboardStats,
  txCreateStake,
  txUnstake,
  txDepositRewards,
  txPause,
  txUnpause,
  txAddPlan,
  getWalletProvider,
  type OnChainPlan,
  type OnChainStake,
  type DashboardStats,
} from './web3';

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'pending';
  message: string;
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('staking_jwt'));
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [stakes, setStakes] = useState<OnChainStake[]>([]);
  const [plans, setPlans] = useState<OnChainPlan[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [contractInfo, setContractInfo] = useState({
    proxyAddress: STAKING_PROXY_ADDRESS,
    implementationAddress: '',
    ownerAddress: '',
    rewardPoolBalance: 0,
    isPaused: false,
  });

  // ── theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ── toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastData['type'], message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── load on-chain data ─────────────────────────────────────────────────────
  const refreshPlans = useCallback(async () => {
    if (!STAKING_PROXY_ADDRESS) return;
    try {
      const fetched = await fetchPlans();
      setPlans(fetched);
    } catch {
      // contract not deployed yet — silently ignore
    }
  }, []);

  const refreshDashboardStats = useCallback(async () => {
    if (!STAKING_PROXY_ADDRESS) return;
    try {
      setDashboardStats(await fetchDashboardStats());
    } catch {
      // ignore
    }
  }, []);

  const refreshUserData = useCallback(async (address: string) => {
    if (!STAKING_PROXY_ADDRESS || !address) return;
    try {
      const [balance, userStakes] = await Promise.all([
        fetchTokenBalance(address),
        fetchUserStakes(address),
      ]);
      setWalletBalance(balance);
      setStakes(userStakes);
    } catch {
      // ignore read errors
    }
  }, []);

  const refreshContractInfo = useCallback(async () => {
    if (!STAKING_PROXY_ADDRESS) return;
    try {
      setContractInfo(await fetchContractInfo());
    } catch {
      // ignore
    }
  }, []);

  // ── load plans + contract info on mount (no wallet needed) ─────────────────
  useEffect(() => {
    if (!STAKING_PROXY_ADDRESS) return;
    refreshPlans();
    refreshContractInfo();
    refreshDashboardStats();
  }, [refreshPlans, refreshContractInfo, refreshDashboardStats]);

  // ── wallet connect ─────────────────────────────────────────────────────────
  const handleWalletConnect = async () => {
    const toastId = addToast('pending', 'Connecting wallet…');
    try {
      const provider = getWalletProvider();
      const accounts: string[] = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      const owner: string = await fetchContractInfo().then((i) => i.ownerAddress).catch(() => '');
      const adminFlag = !!owner && owner.toLowerCase() === address.toLowerCase();

      setWalletAddress(address);
      setWalletConnected(true);
      setIsAdmin(adminFlag);

      await Promise.all([
        refreshUserData(address),
        refreshContractInfo(),
      ]);

      removeToast(toastId);

      // SIWE login
      const signToastId = addToast('pending', 'Please sign the message in MetaMask…');
      try {
        await login(address);
        setIsAuthenticated(true);
        removeToast(signToastId);
        addToast('success', 'Wallet connected & signed in!');
      } catch (signErr: unknown) {
        removeToast(signToastId);
        addToast('error', (signErr as Error).message ?? 'Sign-in failed');
        addToast('success', 'Wallet connected! Click History to sign in.');
      }

      // listen for account changes
      window.ethereum?.on('accountsChanged', (accs: string[]) => {
        if (accs.length === 0) {
          setWalletConnected(false);
          setWalletAddress('');
          setIsAdmin(false);
          setIsAuthenticated(false);
          setStakes([]);
          logout();
        } else {
          setWalletAddress(accs[0]);
          setIsAuthenticated(false);
          logout();
          refreshUserData(accs[0]);
        }
      });
    } catch (err: unknown) {
      removeToast(toastId);
      addToast('error', (err as Error).message ?? 'Failed to connect wallet');
    }
  };

  // ── stake ──────────────────────────────────────────────────────────────────
  const handleStake = async (amount: number, planIndex: number) => {
    const plan = plans[planIndex];
    const toastId = addToast('pending', 'Approving & staking…');
    try {
      await txCreateStake(plan.id, amount);
      await refreshUserData(walletAddress);
      await refreshDashboardStats();
      removeToast(toastId);
      addToast('success', `Staked ${amount} ${TOKEN_SYMBOL} successfully!`);
      setCurrentPage('my-stakes');
    } catch (err: unknown) {
      removeToast(toastId);
      addToast('error', (err as Error).message ?? 'Stake failed');
    }
  };

  // ── unstake ────────────────────────────────────────────────────────────────
  const handleUnstake = async (stakeId: number) => {
    const toastId = addToast('pending', 'Processing unstake…');
    try {
      await txUnstake(stakeId);
      await refreshUserData(walletAddress);
      await refreshDashboardStats();
      removeToast(toastId);
      addToast('success', 'Unstaked successfully!');
    } catch (err: unknown) {
      removeToast(toastId);
      addToast('error', (err as Error).message ?? 'Unstake failed');
    }
  };

  // ── deposit rewards ────────────────────────────────────────────────────────
  const handleDepositRewards = async (amount: number) => {
    const toastId = addToast('pending', 'Depositing rewards…');
    try {
      await txDepositRewards(amount);
      await refreshContractInfo();
      removeToast(toastId);
      addToast('success', `Deposited ${amount} ${TOKEN_SYMBOL} to reward pool!`);
    } catch (err: unknown) {
      removeToast(toastId);
      addToast('error', (err as Error).message ?? 'Deposit failed');
    }
  };

  // ── pause / unpause ────────────────────────────────────────────────────────
  const handleTogglePause = async () => {
    const pausing = !contractInfo.isPaused;
    const toastId = addToast('pending', pausing ? 'Pausing contract…' : 'Unpausing contract…');
    try {
      if (pausing) await txPause(); else await txUnpause();
      await refreshContractInfo();
      removeToast(toastId);
      addToast('success', pausing ? 'Contract paused!' : 'Contract unpaused!');
    } catch (err: unknown) {
      removeToast(toastId);
      addToast('error', (err as Error).message ?? 'Toggle pause failed');
    }
  };

  // ── add plan ───────────────────────────────────────────────────────────────
  const handleAddPlan = async (days: number, apr: number, penalty: number) => {
    const toastId = addToast('pending', 'Adding plan…');
    try {
      await txAddPlan(days, apr, penalty);
      await refreshPlans();
      removeToast(toastId);
      addToast('success', `${days}-day plan added!`);
    } catch (err: unknown) {
      removeToast(toastId);
      addToast('error', (err as Error).message ?? 'Add plan failed');
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} stats={dashboardStats} planCount={plans.length} />;
      case 'stake':
        return walletConnected ? (
          <StakePage walletBalance={walletBalance} plans={plans} onStake={handleStake} />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl mb-4">Please connect your wallet to stake</p>
          </div>
        );
      case 'my-stakes':
        return walletConnected ? (
          <MyStakes stakes={stakes} onUnstake={handleUnstake} />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl mb-4">Please connect your wallet to view stakes</p>
          </div>
        );
      case 'history':
        return walletConnected && isAuthenticated ? (
          <StakingHistory address={walletAddress} />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl mb-4">Please connect and sign in to view history</p>
          </div>
        );
      case 'help':
        return <HelpPage />;
      case 'admin':
        return (
          <AdminPage
            isAdmin={isAdmin}
            contractInfo={contractInfo}
            plans={plans}
            onDepositRewards={handleDepositRewards}
            onTogglePause={handleTogglePause}
            onAddPlan={handleAddPlan}
          />
        );
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        theme={theme}
        onThemeToggle={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        isAdmin={isAdmin}
        onWalletConnect={handleWalletConnect}
      />
      <main className="max-w-[var(--max-width)] mx-auto px-6 py-8">{renderPage()}</main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
