import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/ChangePassword";
import ManageTeam from "./pages/ManageTeam";
import SetupMutumilk from "./pages/SetupMutumilk";
import AgreementsIndex from "./pages/agreements/Index";
import NewAgreement from "./pages/agreements/New";
import AgreementDetails from "./pages/agreements/Details";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/team" element={<ManageTeam />} />
            <Route path="/agreements" element={<AgreementsIndex />} />
            <Route path="/agreements/new" element={<NewAgreement />} />
            <Route path="/agreements/:id" element={<AgreementDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/setup-mutumilk" element={<SetupMutumilk />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
