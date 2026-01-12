import { useState } from 'react';
import { WhaleTransactionFeed } from './WhaleTransactionFeed';
import { WhaleWalletList } from './WhaleWalletList';
import { WhaleStats } from './WhaleStats';
import { polymarketApi } from '@/lib/api/polymarket';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Tab = 'feed' | 'wallets';

export const WhaleTracker = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await polymarketApi.syncData();
      if (result.success) {
        toast.success(t('syncSuccess'));
        window.location.reload();
      } else {
        toast.error(result.error || t('syncFailed'));
      }
    } catch (error) {
      toast.error(t('syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-terminal-foreground flex items-center gap-3">
            <span className="text-3xl">🐋</span>
            {t('polymarketWhaleTracker')}
          </h1>
          <p className="text-terminal-muted text-sm mt-1">
            {t('realTimeMonitoring')}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-terminal-accent/20 border border-terminal-accent text-terminal-accent hover:bg-terminal-accent hover:text-terminal-background transition-all rounded font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⟳</span> {t('syncing')}
            </span>
          ) : (
            `⟳ ${t('syncData')}`
          )}
        </button>
      </div>

      {/* Stats */}
      <WhaleStats />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-terminal-border/30">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 font-mono text-sm transition-all border-b-2 ${
            activeTab === 'feed'
              ? 'border-terminal-accent text-terminal-accent'
              : 'border-transparent text-terminal-muted hover:text-terminal-foreground'
          }`}
        >
          📊 {t('liveFeed')}
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 font-mono text-sm transition-all border-b-2 ${
            activeTab === 'wallets'
              ? 'border-terminal-accent text-terminal-accent'
              : 'border-transparent text-terminal-muted hover:text-terminal-foreground'
          }`}
        >
          👛 {t('whaleWallets')}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'feed' && <WhaleTransactionFeed />}
        {activeTab === 'wallets' && <WhaleWalletList />}
      </div>
    </div>
  );
};
