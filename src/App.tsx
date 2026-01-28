import CursorSetup from "@/components/CursorSetup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import "@/lib/i18n";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Transparency from "./pages/legal/Transparency";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Credits from "./pages/Credits";
import Markets from "./pages/Markets";
import Builder from "./pages/Builder";
import Autonomous from "./pages/Autonomous";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <CursorSetup />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/autonomous" element={<Autonomous />} />
              <Route path="/legal/transparency" element={<Transparency />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
