import { Sun, Moon, Wallet, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

interface NavbarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  walletConnected: boolean;
  walletAddress: string;
  isAdmin: boolean;
  onWalletConnect: () => void;
}

export function Navbar({
  theme,
  onThemeToggle,
  currentPage,
  onNavigate,
  walletConnected,
  walletAddress,
  isAdmin,
  onWalletConnect
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', id: 'dashboard' },
    { name: 'Stake', id: 'stake' },
    { name: 'My Stakes', id: 'my-stakes' },
    ...(isAdmin ? [{ name: 'Admin', id: 'admin' }] : [])
  ];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[var(--max-width)] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600" />
              <span className="text-xl font-semibold">StakeVault</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`transition-colors hover:text-accent ${
                    currentPage === link.id ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onThemeToggle}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {walletConnected ? (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-purple-600" />
                <span>{truncateAddress(walletAddress)}</span>
              </div>
            ) : (
              <Button onClick={onWalletConnect} className="hidden md:flex items-center gap-2">
                <Wallet size={18} />
                Connect Wallet
              </Button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-surface rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left py-2 transition-colors ${
                    currentPage === link.id ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  {link.name}
                </button>
              ))}
              {!walletConnected && (
                <Button onClick={onWalletConnect} className="w-full">
                  <Wallet size={18} className="mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
