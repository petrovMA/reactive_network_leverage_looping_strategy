import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Lending from './pages/Lending';
import Leverage from './pages/Leverage';
import Token from './pages/Token';
import Placeholder from './pages/Placeholder';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lending" element={<Lending />} />
          <Route path="/leverage" element={<Leverage />} />
          <Route path="/token" element={<Token />} />
          <Route path="*" element={<Placeholder />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
