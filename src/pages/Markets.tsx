import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MarketsExplorer from '@/components/markets/MarketsExplorer';
import { Button } from '@/components/ui/button';

const Markets = () => {
  const { t } = useTranslation();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Simple Header */}
      <header className="p-4 border-b border-border bg-card/50 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <span className="text-sm font-medium text-foreground">ElizaBAO</span>
      </header>

      {/* Markets Explorer */}
      <div className="flex-1 overflow-hidden">
        <MarketsExplorer />
      </div>
    </div>
  );
};

export default Markets;
