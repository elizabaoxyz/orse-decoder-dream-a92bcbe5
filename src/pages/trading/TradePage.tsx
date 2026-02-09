import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTrading, useAppConfig } from "@/contexts/ElizaConfigProvider";
import {
  fetchGammaMarkets,
  fetchOrderbook,
  parseJsonField,
  type GammaMarket,
  type OrderBook,
} from "@/lib/elizabao-api";
import { placeOrder, generateL2Headers, resetClobCredentials } from "@/lib/polymarket-client";
import { supabase } from "@/integrations/supabase/client";
import { useOnChainBalances } from "@/hooks/useOnChainBalances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function TradePage() {
  const [searchParams] = useSearchParams();
  const {
    isAuthenticated,
    login,
    userAddress,
    accessToken,
    refreshToken,
    walletClient,
    safeAddress,
    clobCredentials,
    setClobCredentials,
  } = useTrading();
  const { config } = useAppConfig();
  const { safeBalances, loading: balanceLoading, fetchBalances } = useOnChainBalances();

  // Exchange balance from CLOB
  const [exchangeBalance, setExchangeBalance] = useState(0);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  const fetchExchangeBalance = useCallback(async () => {
    if (!clobCredentials || !userAddress) return;
    setExchangeLoading(true);
    try {
      const { data } = await supabase.functions.invoke("clob-balance", {
        body: {
          apiKey: clobCredentials.apiKey,
          secret: clobCredentials.secret,
          passphrase: clobCredentials.passphrase,
          address: userAddress,
          asset_type: "0",
        },
      });
      setExchangeBalance(parseFloat(data?.balance || "0"));
    } catch {}
    setExchangeLoading(false);
  }, [clobCredentials, userAddress]);

  // Fetch balances on mount
  useEffect(() => {
    if (safeAddress) fetchBalances(undefined, safeAddress);
  }, [safeAddress, fetchBalances]);

  useEffect(() => {
    fetchExchangeBalance();
  }, [fetchExchangeBalance]);

  const walletBalance = safeBalances ? parseFloat(safeBalances.usdcE) : 0;
  const totalAvailableDisplay = walletBalance + exchangeBalance;

  // Market selection
  const [markets, setMarkets] = useState<GammaMarket[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<GammaMarket | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [marketSearch, setMarketSearch] = useState("");

  // Orderbook
  const [orderbook, setOrderbook] = useState<OrderBook | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);

  // Order form
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0);
  const [price, setPrice] = useState("0.50");
  const [size, setSize] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
  } | null>(null);

  // Load markets
  useEffect(() => {
    setLoadingMarkets(true);
    fetchGammaMarkets({
      limit: 50,
      active: true,
      closed: false,
      ...(marketSearch ? { _q: marketSearch } : {}),
    })
      .then((data) => {
        setMarkets(data);
        // Auto-select market from URL param
        const marketId = searchParams.get("market");
        if (marketId && !selectedMarket) {
          const found = data.find(
            (m) => m.conditionId === marketId || m.id === marketId
          );
          if (found) setSelectedMarket(found);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingMarkets(false));
  }, [marketSearch]);

  // Load orderbook when market/outcome changes
  const loadOrderbook = async () => {
    if (!selectedMarket) return;

    const tokenIds = parseJsonField<string>(selectedMarket.clobTokenIds);
    const tokenId = tokenIds[selectedOutcome];
    if (!tokenId) {
      toast.error("No token ID for this outcome");
      return;
    }

    setLoadingBook(true);
    try {
      const book = await fetchOrderbook(tokenId);
      setOrderbook(book);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load orderbook");
    } finally {
      setLoadingBook(false);
    }
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!clobCredentials || !walletClient || !userAddress || !selectedMarket) {
      toast.error("Not ready to trade. Check wallet page.");
      return;
    }

    const tokenIds = parseJsonField<string>(selectedMarket.clobTokenIds);
    const tokenId = tokenIds[selectedOutcome];
    if (!tokenId) {
      toast.error("No token ID for selected outcome");
      return;
    }

    const priceNum = parseFloat(price);
    const sizeNum = parseFloat(size);

    if (priceNum < 0.001 || priceNum > 0.999) {
      toast.error("Price must be between 0.001 and 0.999");
      return;
    }
    if (sizeNum <= 0) {
      toast.error("Size must be greater than 0");
      return;
    }

    setSubmitting(true);
    setOrderResult(null);

    // Preflight: check combined balance (wallet + exchange)
    try {
      const makerAmount = priceNum * sizeNum;
      // Refresh balances
      if (safeAddress) await fetchBalances(undefined, safeAddress);
      await fetchExchangeBalance();
      
      const totalAvailable = walletBalance + exchangeBalance;
      if (totalAvailable < makerAmount) {
        const msg = `Insufficient balance: $${totalAvailable.toFixed(2)} available (wallet: $${walletBalance.toFixed(2)}, exchange: $${exchangeBalance.toFixed(2)}), need $${makerAmount.toFixed(2)}.`;
        toast.error(msg);
        setOrderResult({ success: false, message: msg });
        setSubmitting(false);
        return;
      }
      console.log("[TradePage] Preflight OK — wallet:", walletBalance, "exchange:", exchangeBalance, "needed:", makerAmount);
    } catch (preflightErr) {
      console.warn("[TradePage] Preflight check failed, proceeding anyway:", preflightErr);
    }

    try {
      // Refresh access token
      const token = await refreshToken();
      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const funder = (safeAddress || userAddress) as `0x${string}`;
      const tickSize = selectedMarket.minimum_tick_size || "0.01";
      const negRisk = selectedMarket.neg_risk ?? false;

      let activeCreds = clobCredentials;
      const clobUrl = config?.clobApiUrl || "https://api.elizabao.xyz";

      const result = await placeOrder(
        activeCreds,
        userAddress,
        walletClient,
        funder,
        { tokenId, price: priceNum, size: sizeNum, side, tickSize, negRisk },
        token,
        clobUrl
      );

      // Auto-retry on 401 — reset creds and try once more
      if (!result.success && result.errorMsg?.includes("401")) {
        console.log("[TradePage] Got 401 — resetting CLOB creds and retrying…");
        toast.info("Credentials expired — resetting and retrying…");
        try {
          const newCreds = await resetClobCredentials(walletClient, userAddress, clobUrl);
          setClobCredentials(newCreds);
          activeCreds = newCreds;
          console.log(`[TradePage] New creds: signer=${userAddress} apiKey=…${newCreds.apiKey.slice(-6)}`);

          const retryResult = await placeOrder(
            activeCreds,
            userAddress,
            walletClient,
            funder,
            { tokenId, price: priceNum, size: sizeNum, side, tickSize, negRisk },
            token,
            clobUrl
          );

          if (retryResult.success) {
            setOrderResult({
              success: true,
              message: `${side} order placed (after cred reset)!`,
              orderId: retryResult.orderID,
            });
            toast.success("Order placed after credential reset!");
          } else {
            setOrderResult({ success: false, message: retryResult.errorMsg || "Retry failed" });
            toast.error(retryResult.errorMsg || "Retry failed");
          }
          return; // skip normal result handling
        } catch (resetErr) {
          console.error("[TradePage] Cred reset failed:", resetErr);
          toast.error("Failed to reset credentials");
        }
      }

      if (result.success) {
        setOrderResult({
          success: true,
          message: `${side} order placed successfully!`,
          orderId: result.orderID,
        });
        toast.success("Order placed!");
      } else {
        setOrderResult({
          success: false,
          message: result.errorMsg || "Order failed",
        });
        toast.error(result.errorMsg || "Order failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setOrderResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <ArrowUpDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Trade on Polymarket</h2>
        <p className="text-muted-foreground mb-6">
          Login to place orders on prediction markets.
        </p>
        <Button onClick={login} size="lg">
          Login to Trade
        </Button>
      </div>
    );
  }

  // Check readiness
  const canTrade = !!clobCredentials && !!walletClient && !!userAddress && !!accessToken;

  const outcomes = selectedMarket ? parseJsonField<string>(selectedMarket.outcomes) : [];
  const prices = selectedMarket ? parseJsonField<number>(selectedMarket.outcomePrices) : [];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Market Selection */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold">Trade</h1>

        {/* Market search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search markets..."
            value={marketSearch}
            onChange={(e) => setMarketSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Market list */}
        <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
          {loadingMarkets ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            markets.slice(0, 20).map((m) => {
              const isSelected =
                selectedMarket?.id === m.id ||
                selectedMarket?.conditionId === m.conditionId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMarket(m);
                    setOrderbook(null);
                    setOrderResult(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 border-b border-border last:border-0 text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="line-clamp-1">{m.question}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Vol: ${(m.volume24hr || 0).toLocaleString()}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Market Detail */}
        {selectedMarket && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">{selectedMarket.question}</h3>

            <div className="flex flex-wrap gap-2">
              {outcomes.map((outcome, i) => {
                const pct = prices[i]
                  ? (Number(prices[i]) * 100).toFixed(1)
                  : "—";
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedOutcome(i)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                      selectedOutcome === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {outcome}: {pct}%
                  </button>
                );
              })}
            </div>

            {/* Orderbook */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadOrderbook}
                disabled={loadingBook}
              >
                {loadingBook ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                )}
                Load Orderbook
              </Button>
            </div>

            {orderbook && (
              <div className="grid grid-cols-2 gap-3">
                <OrderbookSide title="Bids" levels={orderbook.bids} color="green" />
                <OrderbookSide title="Asks" levels={orderbook.asks} color="red" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Order Form */}
      <div className="space-y-4">
        {/* Available Balance */}
        <div className="border border-primary/30 rounded-lg p-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Available to Trade</span>
            </div>
            <button
              onClick={() => {
                if (safeAddress) fetchBalances(undefined, safeAddress);
                fetchExchangeBalance();
              }}
              disabled={balanceLoading || exchangeLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              {(balanceLoading || exchangeLoading) ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </button>
          </div>
          <div className="text-xl font-bold font-mono mt-1">
            ${totalAvailableDisplay.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">USDC.e</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground font-mono">
            <span>Wallet: ${walletBalance.toFixed(2)}</span>
            <span>Exchange: ${exchangeBalance.toFixed(2)}</span>
          </div>
          {walletBalance > 0 && exchangeBalance === 0 && (
            <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-[10px] text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>
                Your ${walletBalance.toFixed(2)} USDC.e is in your Trading Wallet but not deposited on the exchange yet. 
                The exchange may pull funds directly from your wallet if approvals are set.
              </span>
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Place Order
          </h3>

          {!canTrade && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-xs text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {!clobCredentials
                  ? "Initialize trading credentials on the Wallet page first."
                  : "Complete wallet setup before trading."}
              </span>
            </div>
          )}

          {/* Side toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={side === "BUY" ? "default" : "outline"}
              onClick={() => setSide("BUY")}
              className={
                side === "BUY"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
            >
              BUY
            </Button>
            <Button
              variant={side === "SELL" ? "default" : "outline"}
              onClick={() => setSide("SELL")}
              className={
                side === "SELL"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
            >
              SELL
            </Button>
          </div>

          {/* Selected outcome */}
          {selectedMarket && outcomes.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Outcome
              </label>
              <Select
                value={String(selectedOutcome)}
                onValueChange={(v) => setSelectedOutcome(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outcomes.map((o, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {o} ({prices[i] ? (Number(prices[i]) * 100).toFixed(1) : "—"}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Price (0.001 – 0.999)
            </label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              max="0.999"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Shares
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Cost estimate */}
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Est. Cost</span>
            <span className="font-mono">
              ${(parseFloat(price || "0") * parseFloat(size || "0")).toFixed(2)}{" "}
              USDC
            </span>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmitOrder}
            disabled={submitting || !canTrade || !selectedMarket}
            className="w-full"
            size="lg"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {side === "BUY" ? "Buy" : "Sell"} {outcomes[selectedOutcome] || ""}
          </Button>

          {/* Result */}
          {orderResult && (
            <div
              className={`rounded-md p-3 text-xs flex items-start gap-2 ${
                orderResult.success
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-destructive/10 border border-destructive/20 text-destructive"
              }`}
            >
              {orderResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <p>{orderResult.message}</p>
                {orderResult.orderId && (
                  <p className="font-mono mt-1 text-[10px] opacity-80">
                    Order ID: {orderResult.orderId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Market info */}
        {selectedMarket && (
          <div className="border border-border rounded-lg p-3 text-xs space-y-1.5 text-muted-foreground">
            <div className="flex justify-between">
              <span>Tick Size</span>
              <span className="font-mono">
                {selectedMarket.minimum_tick_size || "0.01"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Neg Risk</span>
              <span>{selectedMarket.neg_risk ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span>Funder</span>
              <span className="font-mono">
                {(safeAddress || userAddress || "—").slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sig Type</span>
              <Badge variant="secondary" className="text-[10px]">
                {safeAddress ? "GNOSIS_SAFE (2)" : "EOA (0)"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderbookSide({
  title,
  levels,
  color,
}: {
  title: string;
  levels: { price: string; size: string }[];
  color: "green" | "red";
}) {
  const colorClass = color === "green" ? "text-green-400" : "text-red-400";
  return (
    <div>
      <h4 className={`text-xs font-medium mb-1.5 ${colorClass}`}>{title}</h4>
      <div className="space-y-0.5 text-[10px] font-mono max-h-40 overflow-y-auto">
        {levels.length === 0 ? (
          <div className="text-muted-foreground py-2 text-center">Empty</div>
        ) : (
          levels.slice(0, 10).map((level, i) => (
            <div key={i} className="flex justify-between px-1.5 py-0.5 hover:bg-muted/30 rounded">
              <span className={colorClass}>{level.price}</span>
              <span className="text-muted-foreground">{parseFloat(level.size).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
