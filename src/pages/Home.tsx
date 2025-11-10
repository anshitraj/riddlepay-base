import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Gift, Lock, Sparkles } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-5xl shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
                🎁
              </div>
            </div>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              Send Crypto Gifts with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Secret Riddles
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Lock USDC gifts behind custom riddles. Only your friends who solve the clue can unlock the treasure! 🔐✨
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg h-14 px-8 bg-primary hover:bg-primary/90"
                onClick={() => navigate('/send')}
              >
                <Gift className="mr-2 h-5 w-5" />
                Send a Gift
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-14 px-8"
                onClick={() => navigate('/claim')}
              >
                <Lock className="mr-2 h-5 w-5" />
                Claim a Gift
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                  🎨
                </div>
                <h3 className="mb-2 text-xl font-semibold">1. Create a Riddle</h3>
                <p className="text-muted-foreground">
                  Write a fun riddle or clue that only your friend can solve. Make it personal!
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                  💰
                </div>
                <h3 className="mb-2 text-xl font-semibold">2. Lock USDC</h3>
                <p className="text-muted-foreground">
                  Choose how much USDC to gift. The funds are locked in a smart contract on Base.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                  🔓
                </div>
                <h3 className="mb-2 text-xl font-semibold">3. Friend Unlocks</h3>
                <p className="text-muted-foreground">
                  Your friend solves the riddle and instantly receives the USDC. Confetti time! 🎉
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-12 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-4 text-3xl font-bold">Ready to Send Your First Gift?</h2>
              <p className="mb-6 text-muted-foreground">
                Connect your wallet and start creating memorable crypto moments with your friends!
              </p>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/send')}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
