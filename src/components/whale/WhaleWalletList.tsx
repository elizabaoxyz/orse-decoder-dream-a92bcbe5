import { useEffect, useState } from 'react';
import { polymarketApi, WhaleWallet } from '@/lib/api/polymarket';
import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhaleDetailModal } from './WhaleDetailModal';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 10;

export const WhaleWalletList = () => {
  const { t } = useTranslation();
  const [allWallets, setAllWallets] = useState<WhaleWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      const data = await polymarketApi.getWhaleWallets();
      const filteredWallets = data.filter(
        w => !w.label || w.label.toLowerCase() !== 'unknown'
      );
      setAllWallets(filteredWallets);
      setLoading(false);
    };

    fetchWallets();
  }, []);

  const totalPages = Math.ceil(allWallets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWallets = allWallets.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatVolume = (volume: number | null) => {
    if (!volume) return '$0';
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-terminal-surface/30 animate-pulse rounded border border-terminal-border/20" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {allWallets.length === 0 ? (
          <div className="text-center py-8 text-terminal-muted">
            <p>{t('noWhaleWallets')}</p>
          </div>
        ) : (
          <>
            {currentWallets.map((wallet) => (
              <div
                key={wallet.id}
                onClick={() => setSelectedWallet(wallet.wallet_address)}
                className="p-4 bg-terminal-surface/20 border border-terminal-border/30 rounded-lg hover:border-terminal-accent/50 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {wallet.is_featured && (
                      <span className="text-yellow-400 text-lg">🐋</span>
                    )}
                    <span className="font-mono text-terminal-foreground">
                      {truncateAddress(wallet.wallet_address)}
                    </span>
                    {wallet.label && (
                      <span className="text-xs bg-terminal-accent/20 text-terminal-accent px-2 py-0.5 rounded">
                        {wallet.label}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-terminal-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-terminal-muted block text-xs mb-1">{t('volume')}</span>
                    <span className="text-terminal-accent font-bold">
                      {formatVolume(wallet.total_volume)}
                    </span>
                  </div>
                  <div>
                    <span className="text-terminal-muted block text-xs mb-1">{t('winRate')}</span>
                    <span className={`font-bold ${
                      (wallet.win_rate || 0) >= 60 ? 'text-primary' : 
                      (wallet.win_rate || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {wallet.win_rate?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-terminal-muted block text-xs mb-1">{t('lastActive')}</span>
                    <span className="text-terminal-foreground/70">
                      {wallet.last_active 
                        ? formatDistanceToNow(new Date(wallet.last_active), { addSuffix: true })
                        : t('nA')
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-terminal-border/30">
                <span className="text-sm text-terminal-muted">
                  {startIndex + 1}-{Math.min(endIndex, allWallets.length)} / {allWallets.length} {t('ofWallets')}
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1); }}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-terminal-border/50 bg-terminal-surface/30 hover:bg-terminal-accent/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, index, arr) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="text-terminal-muted px-1">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); goToPage(page); }}
                            className={`h-8 w-8 p-0 ${
                              currentPage === page 
                                ? 'bg-terminal-accent text-terminal-background' 
                                : 'border-terminal-border/50 bg-terminal-surface/30 hover:bg-terminal-accent/20'
                            }`}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1); }}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-terminal-border/50 bg-terminal-surface/30 hover:bg-terminal-accent/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <WhaleDetailModal 
        walletAddress={selectedWallet} 
        onClose={() => setSelectedWallet(null)} 
      />
    </>
  );
};
