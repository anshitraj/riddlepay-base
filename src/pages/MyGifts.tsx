import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { getContract } from '@/lib/ethereum';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Gift {
  id: number;
  sender: string;
  receiver: string;
  amount: string;
  claimed: boolean;
}

const MyGifts = () => {
  const { address, isConnected, connect } = useWallet();
  const [sentGifts, setSentGifts] = useState<Gift[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadGifts();
    }
  }, [isConnected, address]);

  const loadGifts = async () => {
    try {
      const contract = await getContract();
      const giftCount = await contract.giftCount();
      
      const sent: Gift[] = [];
      const received: Gift[] = [];

      for (let i = 0; i < Number(giftCount); i++) {
        const gift = await contract.getGift(i);
        const giftData: Gift = {
          id: i,
          sender: gift.sender,
          receiver: gift.receiver,
          amount: ethers.formatUnits(gift.amount, 6),
          claimed: gift.claimed
        };

        if (gift.sender.toLowerCase() === address?.toLowerCase()) {
          sent.push(giftData);
        }
        if (gift.receiver.toLowerCase() === address?.toLowerCase()) {
          received.push(giftData);
        }
      }

      setSentGifts(sent);
      setReceivedGifts(received);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="mx-auto max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-6xl">🔌</div>
            <h2 className="mb-2 text-2xl font-bold">Connect Your Wallet</h2>
            <p className="mb-6 text-muted-foreground">
              Connect your wallet to view your gifts
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold">My Gifts</h1>
        <p className="mt-2 text-muted-foreground">Track gifts you've sent and received</p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received">Received ({receivedGifts.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentGifts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receivedGifts.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <div className="mb-2 text-4xl">📭</div>
                  No gifts received yet
                </CardContent>
              </Card>
            ) : (
              receivedGifts.map((gift) => (
                <Card key={gift.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Gift #{gift.id}</span>
                      <Badge variant={gift.claimed ? "secondary" : "default"}>
                        {gift.claimed ? '✓ Claimed' : '🔒 Locked'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>From {formatAddress(gift.sender)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{gift.amount} USDC</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sentGifts.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <div className="mb-2 text-4xl">📤</div>
                  No gifts sent yet
                </CardContent>
              </Card>
            ) : (
              sentGifts.map((gift) => (
                <Card key={gift.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Gift #{gift.id}</span>
                      <Badge variant={gift.claimed ? "secondary" : "default"}>
                        {gift.claimed ? '✓ Claimed' : '⏳ Pending'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>To {formatAddress(gift.receiver)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{gift.amount} USDC</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyGifts;
