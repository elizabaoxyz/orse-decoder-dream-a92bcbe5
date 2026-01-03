import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, ExternalLink } from 'lucide-react';

interface WhaleWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  total_volume: number | null;
  win_rate: number | null;
  last_active: string | null;
  is_featured: boolean | null;
}

export const WhaleStatsPanel = () => {
  const [wallets, setWallets] = useState<WhaleWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      const { data, error } = await supabase
        .from('whale_wallets')
        .select('*')
        .order('total_volume', { ascending: false });
      
      if (data) {
        setWallets(data);
      }
      setLoading(false);
    };

    fetchWallets();
    const interval = setInterval(fetchWallets, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatVolume = (volume: number | null) => {
    if (!volume) return '$0';
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getPolygonScanUrl = (address: string) => {
    return `https://polygonscan.com/address/${address}`;
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        Loading whale wallets...
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">No whale wallets tracked yet</p>
        <p className="text-muted-foreground text-xs mt-1">Whales will appear when large trades (&gt;$5000) are detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Count */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          TRACKED_WHALES: {wallets.length}
        </span>
      </div>

      {/* Wallet List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto scrollbar-thin">
        {wallets.map((wallet) => (
          <div 
            key={wallet.id} 
            className="p-3 bg-card/50 border border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <a 
                href={getPolygonScanUrl(wallet.wallet_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {formatAddress(wallet.wallet_address)}
                <ExternalLink className="w-3 h-3" />
              </a>
              {wallet.is_featured && (
                <span className="text-xs text-yellow-500">⭐</span>
              )}
            </div>
            
            {wallet.label && (
              <div className="text-xs text-muted-foreground mt-1">{wallet.label}</div>
            )}
            
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-foreground">VOLUME:</span>
              <span className="font-mono text-foreground">{formatVolume(wallet.total_volume)}</span>
            </div>
            
            {wallet.win_rate !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">WIN_RATE:</span>
                <span className={`font-mono ${wallet.win_rate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                  {wallet.win_rate.toFixed(1)}%
                </span>
              </div>
            )}

            {wallet.last_active && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">LAST_ACTIVE:</span>
                <span className="text-foreground/60">
                  {new Date(wallet.last_active).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Full Address (copyable) */}
            <div 
              className="mt-2 text-[10px] text-muted-foreground/50 font-mono truncate cursor-pointer hover:text-muted-foreground"
              title="Click to copy"
              onClick={() => navigator.clipboard.writeText(wallet.wallet_address)}
            >
              {wallet.wallet_address}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhaleStatsPanel;
