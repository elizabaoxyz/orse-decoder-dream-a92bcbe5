import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, Loader2, Gift, Zap, Star } from 'lucide-react';

interface UserCredits {
  credits: number;
}

const Credits = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
      } else {
        setCredits(data?.credits || 0);
      }
      setLoading(false);
    };

    if (user) {
      fetchCredits();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const creditPackages = [
    { name: 'Starter', credits: 100, price: '$9.99', icon: Gift },
    { name: 'Pro', credits: 500, price: '$39.99', icon: Zap, popular: true },
    { name: 'Premium', credits: 1500, price: '$99.99', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Credits</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Current Balance */}
          <section className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/30 p-6 text-center">
            <Coins className="w-12 h-12 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-2">Your Balance</p>
            <h2 className="text-5xl font-bold text-foreground mb-2">{credits}</h2>
            <p className="text-primary font-medium">Credits Available</p>
          </section>

          {/* Credit Packages */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4">Get More Credits</h3>
            <div className="grid gap-4">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative bg-card rounded-lg border p-4 flex items-center justify-between ${
                    pkg.popular ? 'border-primary' : 'border-border'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${pkg.popular ? 'bg-primary/20' : 'bg-muted'}`}>
                      <pkg.icon className={`w-6 h-6 ${pkg.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                      <p className="text-sm text-muted-foreground">{pkg.credits} Credits</p>
                    </div>
                  </div>
                  <Button
                    variant={pkg.popular ? 'default' : 'outline'}
                    className={pkg.popular ? 'bg-primary hover:bg-primary/90' : ''}
                  >
                    {pkg.price}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Usage Info */}
          <section className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">How Credits Work</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Each AI chat message costs 1 credit</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Image generation costs 5 credits</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Video generation costs 20 credits</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Credits;
