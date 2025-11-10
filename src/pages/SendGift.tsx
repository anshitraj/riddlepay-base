import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/contexts/WalletContext';
import { getContract, getUSDCContract } from '@/lib/ethereum';
import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const SendGift = () => {
  const { isConnected, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiver: '',
    amount: '',
    riddle: '',
    answer: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Validate Ethereum address
      if (!ethers.isAddress(formData.receiver)) {
        throw new Error('Invalid receiver address');
      }

      const amount = ethers.parseUnits(formData.amount, 6); // USDC has 6 decimals
      
      // Get contracts
      const usdcContract = await getUSDCContract();
      const giftContract = await getContract();
      
      // Approve USDC spending
      toast({
        title: "Step 1/2",
        description: "Approving USDC spending...",
      });
      
      const approveTx = await usdcContract.approve(await giftContract.getAddress(), amount);
      await approveTx.wait();

      // Create gift
      toast({
        title: "Step 2/2",
        description: "Creating gift...",
      });

      const createTx = await giftContract.createGift(
        formData.receiver,
        formData.answer,
        amount
      );
      await createTx.wait();

      toast({
        title: "Gift Sent! 🎁",
        description: "Your secret gift has been created successfully!",
      });

      // Reset form
      setFormData({
        receiver: '',
        amount: '',
        riddle: '',
        answer: ''
      });
    } catch (error: any) {
      console.error('Error creating gift:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create gift",
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
              You need to connect your wallet to send gifts
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
            <span>🎁</span> Send a Secret Gift
          </CardTitle>
          <CardDescription>
            Lock USDC behind a riddle that only your friend can solve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="receiver">Receiver Address</Label>
              <Input
                id="receiver"
                placeholder="0x..."
                value={formData.receiver}
                onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Gift Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riddle">Riddle/Clue 💬</Label>
              <Textarea
                id="riddle"
                placeholder="What's the name of the place where we first met?"
                value={formData.riddle}
                onChange={(e) => setFormData({ ...formData, riddle: e.target.value })}
                rows={3}
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be visible to the receiver. Make it fun!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer 🔑</Label>
              <Input
                id="answer"
                type="password"
                placeholder="Central Park"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be hashed and stored securely on-chain
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
                  Creating Gift...
                </>
              ) : (
                'Send Gift 🎁'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendGift;
