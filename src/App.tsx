import CursorSetup from "@/components/CursorSetup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Affiliate from "./pages/Affiliate";
import AffiliateApply from "./pages/AffiliateApply";
import Privacy from "./pages/legal/Privacy";
import Partners from "./pages/legal/Partners";
import About from "./pages/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CursorSetup />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/affiliate/apply" element={<AffiliateApply />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/partners" element={<Partners />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
