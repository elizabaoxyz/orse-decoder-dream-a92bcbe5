import { useState, useEffect } from "react";
import {
  fetchBuilderVolume,
  fetchBuilderLeaderboard,
  type BuilderVolume,
  type LeaderboardEntry,
} from "@/lib/elizabao-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, TrendingUp, Users, BarChart3 } from "lucide-react";

type TimePeriod = "DAY" | "WEEK" | "MONTH" | "ALL";

const periodLabels: Record<TimePeriod, string> = {
  DAY: "24h",
  WEEK: "7d",
  MONTH: "30d",
  ALL: "All Time",
};

export default function BuilderStatsPage() {
  const [period, setPeriod] = useState<TimePeriod>("MONTH");
  const [volumes, setVolumes] = useState<BuilderVolume[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingVolume, setLoadingVolume] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find ElizaBAO in volumes
  const elizaStats = volumes.find(
    (v) =>
      v.builderName?.toLowerCase().includes("elizabao") ||
      v.builderId?.toLowerCase().includes("elizabao")
  );

  useEffect(() => {
    setLoadingVolume(true);
    setError(null);
    fetchBuilderVolume(period)
      .then((data) => {
        setVolumes(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingVolume(false));
  }, [period]);

  useEffect(() => {
    setLoadingLeaderboard(true);
    fetchBuilderLeaderboard({ timePeriod: "MONTH", limit: 50, offset: 0 })
      .then((data) => {
        setLeaderboard(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Leaderboard error:", err))
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Builder Stats
          </h1>
          <p className="text-sm text-muted-foreground">
            ElizaBAO — Verified Polymarket Builder
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(Object.keys(periodLabels) as TimePeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* ElizaBAO Stats Card */}
      <div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            E
          </div>
          <div>
            <h2 className="font-bold text-lg">ElizaBAO</h2>
            <Badge variant="secondary" className="text-[10px]">
              Verified Builder
            </Badge>
          </div>
        </div>

        {loadingVolume ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : elizaStats ? (
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Volume"
              value={`$${parseFloat(elizaStats.volume || "0").toLocaleString()}`}
            />
            <StatCard
              icon={<Trophy className="w-4 h-4" />}
              label="Rank"
              value={`#${elizaStats.rank || "—"}`}
            />
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Active Users"
              value={String(elizaStats.activeUsers || 0)}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No volume data for {periodLabels[period]}. Start routing trades to build stats!
          </p>
        )}
      </div>

      {/* Volume by Period */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Volume by Period
        </h3>

        {loadingVolume ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : volumes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Rank</th>
                  <th className="pb-2 pr-4">Builder</th>
                  <th className="pb-2 pr-4 text-right">Volume</th>
                  <th className="pb-2 text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {volumes.slice(0, 20).map((v, i) => {
                  const isEliza =
                    v.builderName?.toLowerCase().includes("elizabao") ||
                    v.builderId?.toLowerCase().includes("elizabao");
                  return (
                    <tr
                      key={v.builderId || i}
                      className={`border-b border-border/50 last:border-0 ${
                        isEliza ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-2 pr-4 font-mono text-xs">
                        {v.rank || i + 1}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={isEliza ? "text-primary font-medium" : ""}>
                          {v.builderName || v.builderId?.slice(0, 12) || "—"}
                        </span>
                        {isEliza && (
                          <Badge className="ml-2 text-[9px]" variant="secondary">
                            You
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-xs">
                        ${parseFloat(v.volume || "0").toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-xs">
                        {v.activeUsers || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboard (Monthly) */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Monthly Leaderboard (Top 50)
        </h3>

        {loadingLeaderboard ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No leaderboard data
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Builder</th>
                  <th className="pb-2 pr-4 text-right">Volume</th>
                  <th className="pb-2 pr-4 text-right">Trades</th>
                  <th className="pb-2 text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const isEliza =
                    entry.builderName?.toLowerCase().includes("elizabao") ||
                    entry.builderId?.toLowerCase().includes("elizabao");
                  return (
                    <tr
                      key={entry.builderId || i}
                      className={`border-b border-border/50 last:border-0 ${
                        isEliza ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-1.5 pr-4 font-mono text-xs">
                        {entry.rank || i + 1}
                      </td>
                      <td className="py-1.5 pr-4 text-xs">
                        <span className={isEliza ? "text-primary font-medium" : ""}>
                          {entry.builderName || entry.builderId?.slice(0, 12) || "—"}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 text-right font-mono text-xs">
                        ${parseFloat(entry.volume || "0").toLocaleString()}
                      </td>
                      <td className="py-1.5 pr-4 text-right text-xs">
                        {entry.trades || 0}
                      </td>
                      <td className="py-1.5 text-right text-xs">
                        {entry.activeUsers || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}
