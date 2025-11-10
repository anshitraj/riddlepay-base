import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { NavLink } from './NavLink';
import { Gift, List, Unlock } from 'lucide-react';

export const Header = () => {
  const { address, isConnected, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-2xl">
              🎁
            </div>
            <span className="text-xl font-bold">Secret Gifting</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/send" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              <Gift className="h-4 w-4" />
              Send Gift
            </NavLink>
            <NavLink 
              to="/my-gifts" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              <List className="h-4 w-4" />
              My Gifts
            </NavLink>
            <NavLink 
              to="/claim" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              <Unlock className="h-4 w-4" />
              Claim Gift
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium">{formatAddress(address!)}</span>
                </div>
                <Button variant="outline" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connect} className="bg-primary hover:bg-primary/90">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
