import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, TrendingDown, Clock, ExternalLink } from 'lucide-react';
import { ClobMarket } from '@/lib/api/polymarket-clob';
import { format } from 'date-fns';

interface MarketCardProps {
  market: ClobMarket;
}

const MarketCard = ({ market }: MarketCardProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const yesToken = market.tokens?.find((t) => t.outcome === 'Yes');
  const noToken = market.tokens?.find((t) => t.outcome === 'No');

  const yesPrice = yesToken?.price ?? 0.5;
  const noPrice = noToken?.price ?? 0.5;

  const formatPrice = (price: number) => `${(price * 100).toFixed(1)}¢`;
  const formatPercent = (price: number) => `${(price * 100).toFixed(0)}%`;

  const isActive = market.active && !market.closed;

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'politics':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'crypto':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'sports':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'entertainment':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <>
      <div
        className="group relative border border-border bg-card/50 p-4 cursor-pointer rounded-2xl transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10 overflow-hidden"
        onClick={() => setIsOpen(true)}
      >
        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            }`}
          />
        </div>

        {/* Category badge */}
        {market.category && (
          <span
            className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mb-2 ${getCategoryColor(
              market.category
            )}`}
          >
            {market.category}
          </span>
        )}

        {/* Question */}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors pr-4">
          {market.question || market.description || 'Untitled Market'}
        </h3>

        {/* Price bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-500 w-8">YES</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${yesPrice * 100}%` }}
              />
            </div>
            <span className="text-xs text-foreground font-mono w-10 text-right">
              {formatPercent(yesPrice)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 w-8">NO</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${noPrice * 100}%` }}
              />
            </div>
            <span className="text-xs text-foreground font-mono w-10 text-right">
              {formatPercent(noPrice)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {market.end_date_iso
              ? format(new Date(market.end_date_iso), 'MMM d, yyyy')
              : 'No end date'}
          </div>
          <span className={isActive ? 'text-green-500' : 'text-muted-foreground'}>
            {isActive ? t('active') : t('closed')}
          </span>
        </div>
      </div>

      {/* Modal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-card border-2 border-primary shadow-2xl shadow-primary/40 w-[90%] max-w-lg rounded-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: 'modal-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div className="flex-1 pr-4">
                  {market.category && (
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mb-2 ${getCategoryColor(
                        market.category
                      )}`}
                    >
                      {market.category}
                    </span>
                  )}
                  <h3 className="text-foreground font-bold text-lg">
                    {market.question || market.description || 'Untitled Market'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-500 mb-1">YES</p>
                    <p className="text-2xl font-bold text-green-500">{formatPrice(yesPrice)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatPercent(yesPrice)}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-red-500 mb-1">NO</p>
                    <p className="text-2xl font-bold text-red-500">{formatPrice(noPrice)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatPercent(noPrice)}</p>
                  </div>
                </div>

                {/* Market Info */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('status')}</span>
                    <span className={isActive ? 'text-green-500' : 'text-muted-foreground'}>
                      {isActive ? t('active') : t('closed')}
                    </span>
                  </div>
                  {market.end_date_iso && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('endDate')}</span>
                      <span className="text-foreground">
                        {format(new Date(market.end_date_iso), 'PPP')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('minOrderSize')}</span>
                    <span className="text-foreground font-mono">
                      ${market.minimum_order_size || '0.01'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {market.description && market.description !== market.question && (
                  <div className="space-y-2">
                    <h4 className="text-foreground font-medium text-xs uppercase tracking-wide">
                      {t('description')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {market.description}
                    </p>
                  </div>
                )}

                {/* View on Polymarket */}
                {market.market_slug && (
                  <a
                    href={`https://polymarket.com/event/${market.market_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('viewOnPolymarket')}
                  </a>
                )}
              </div>
            </div>
            <style>{`
              @keyframes modal-bounce {
                0% { opacity: 0; transform: scale(0.5) translateY(20px); }
                50% { transform: scale(1.02) translateY(-5px); }
                70% { transform: scale(0.98) translateY(2px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  );
};

export default MarketCard;
