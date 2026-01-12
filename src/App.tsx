import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AudioProvider } from "@/contexts/AudioContext";
import Index from "./pages/Index";
import Scan from "./pages/Scan";
import Result from "./pages/Result";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import BookingConfirmation from "./pages/BookingConfirmation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AudioProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Redirect old /auth route to home - users enter via anonymous access */}
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/result/:id" element={<Result />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/booking-confirmation" element={<BookingConfirmation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AudioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
