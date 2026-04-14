import { BookOpen, TrendingUp, AlertTriangle, Wallet, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { TOKEN_SYMBOL } from '../web3';

interface AccordionItemProps {
  question: string;
  answer: React.ReactNode;
}

function AccordionItem({ question, answer }: AccordionItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface transition-colors"
      >
        <span className="font-medium">{question}</span>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-6 py-4 border-t border-border text-muted-foreground text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl mb-2">Help Center</h1>
        <p className="text-muted-foreground">Everything you need to know about staking on StakeVault</p>
      </div>

      {/* How to Stake */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-lg">
            <BookOpen className="text-accent" size={20} />
          </div>
          <h2 className="text-2xl">How to Stake</h2>
        </div>

        <div className="space-y-4">
          {[
            { step: '1', title: 'Connect your wallet', desc: 'Click "Connect Wallet" in the top right. MetaMask will ask you to connect and sign a message to verify your identity.' },
            { step: '2', title: 'Go to Stake page', desc: 'Navigate to the Stake page from the top menu.' },
            { step: '3', title: 'Choose a plan', desc: 'Select a staking plan based on your preferred lock period and APR. Longer lock periods offer higher rewards.' },
            { step: '4', title: 'Enter amount', desc: `Enter the amount of ${TOKEN_SYMBOL} you want to stake, or click MAX to use your full balance.` },
            { step: '5', title: 'Confirm stake', desc: 'Click "Confirm Stake". MetaMask will ask you to approve two transactions — one to approve the token spend, and one to create the stake.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 p-5 bg-surface border border-border rounded-xl">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
                {step}
              </div>
              <div>
                <p className="font-medium mb-1">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reward Formula */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-success/10 rounded-lg">
            <TrendingUp className="text-success" size={20} />
          </div>
          <h2 className="text-2xl">Reward Formula</h2>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
          <div className="bg-background rounded-lg p-4 font-mono text-center text-lg">
            Reward = Amount × APR × Days / 365 / 100
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-background rounded-lg">
              <p className="text-muted-foreground mb-1">Example</p>
              <p className="text-lg mb-2">1,000 {TOKEN_SYMBOL}</p>
              <p className="text-muted-foreground">staked for 90 days at 12% APR</p>
            </div>
            <div className="p-4 bg-background rounded-lg flex items-center justify-center text-muted-foreground text-2xl">
              →
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-muted-foreground mb-1">Reward</p>
              <p className="text-lg text-success mb-2">+29.59 {TOKEN_SYMBOL}</p>
              <p className="text-muted-foreground">1,000 × 12 × 90 / 365 / 100</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Rewards accrue continuously from the moment you stake. The pending reward is visible in real time on the My Stakes page.
          </div>
        </div>
      </section>

      {/* Early Unstake Warning */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-error/10 rounded-lg">
            <AlertTriangle className="text-error" size={20} />
          </div>
          <h2 className="text-2xl">Early Unstake Penalty</h2>
        </div>

        <div className="bg-error/5 border border-error/20 rounded-xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            If you unstake before the lock period ends, a <span className="text-warning font-medium">penalty</span> is applied to your accrued reward. Your original staked amount is always returned in full.
          </p>
          <div className="bg-background rounded-lg p-4 font-mono text-sm">
            You receive = Amount + (Reward × penalty) / 100
          </div>
          <p className="text-sm text-muted-foreground">
            Once the lock period expires, your stake is marked as <span className="text-success">Matured</span> and you can withdraw with no penalty.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Coins className="text-accent" size={20} />
          </div>
          <h2 className="text-2xl">FAQ</h2>
        </div>

        <div className="space-y-3">
          <AccordionItem
            question={`Where do my ${TOKEN_SYMBOL} tokens go when I stake?`}
            answer={`Your tokens are transferred to the StakeVault smart contract on Sepolia. The contract holds them securely until you unstake. You can verify this on Etherscan at any time.`}
          />
          <AccordionItem
            question="Can I have multiple stakes at the same time?"
            answer="Yes. You can create as many stakes as you want across different plans. Each stake is tracked independently with its own ID, start time, and pending reward."
          />
          <AccordionItem
            question="How do I see my staking history?"
            answer="Go to the History page. You need to be signed in (wallet connected + message signed) to view your full on-chain history, which is indexed by The Graph protocol."
          />
          <AccordionItem
            question="Is the contract audited?"
            answer="The contract is deployed on Sepolia testnet and uses OpenZeppelin's battle-tested libraries (UUPS upgradeable proxy, ReentrancyGuard, Pausable, SafeERC20). A full audit is recommended before mainnet deployment."
          />
          <AccordionItem
            question="What wallet do I need?"
            answer="Any EVM-compatible wallet works — MetaMask is recommended. Make sure you're connected to the Sepolia testnet."
          />
          <AccordionItem
            question="Why do I need to sign a message to view history?"
            answer="The sign-in message proves you own the wallet address without sharing your private key. This is called Sign-In with Ethereum (SIWE) — a secure, password-free authentication standard."
          />
        </div>
      </section>

      {/* Need more help */}
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="p-3 bg-accent/10 rounded-lg">
          <Wallet className="text-accent" size={24} />
        </div>
        <div>
          <p className="font-medium mb-1">Still need help?</p>
          <p className="text-sm text-muted-foreground">
            Check the contract directly on{' '}
            <a
              href={`https://sepolia.etherscan.io/address/0x08c4390bf06080E8775Ed2c5fb5C4E36a465435C`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Sepolia Etherscan
            </a>
            {' '}to verify all transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
