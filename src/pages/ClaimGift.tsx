import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/contexts/WalletContext';
import { getContract } from '@/lib/ethereum';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const ClaimGift = () => {
  const { isConnected, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [giftId, setGiftId] = useState('');
  const [answer, setAnswer] = useState('');

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const contract = await getContract();
      
      const claimTx = await contract.claimGift(giftId, answer);
      await claimTx.wait();

      // Trigger confetti
      triggerConfetti();

      toast({
        title: "🎉 Gift Claimed!",
        description: "You successfully unlocked your gift! USDC has been transferred to your wallet.",
      });

      setGiftId('');
      setAnswer('');
    } catch (error: any) {
      console.error('Error claiming gift:', error);
      
      let errorMessage = "Failed to claim gift";
      if (error.message?.includes("Wrong answer")) {
        errorMessage = "Wrong answer! Try again 🤔";
      } else if (error.message?.includes("Not receiver")) {
        errorMessage = "This gift isn't for you!";
      } else if (error.message?.includes("Already claimed")) {
        errorMessage = "This gift has already been claimed";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="mx-auto max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-6xl">🔌</div>
            <h2 className="mb-2 text-2xl font-bold">Connect Your Wallet</h2>
            <p className="mb-6 text-muted-foreground">
              You need to connect your wallet to claim gifts
            </p>
            <Button onClick={connect} className="bg-primary hover:bg-primary/90">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-3xl">
            <span>🔓</span> Claim Your Gift
          </CardTitle>
          <CardDescription>
            Solve the riddle to unlock your secret gift
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleClaim} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="giftId">Gift ID</Label>
              <Input
                id="giftId"
                type="number"
                placeholder="0"
                value={giftId}
                onChange={(e) => setGiftId(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                The sender should have shared this ID with you
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <h3 className="font-semibold">The Riddle</h3>
              </div>
              <p className="text-muted-foreground">
                Your friend left you a clue to unlock this gift. Think carefully!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Input
                id="answer"
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Take your best guess! 🎯
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                'Unlock Gift 🎁'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimGift;
