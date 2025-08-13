import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ComponentDemo from "./pages/ComponentDemo";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <ComponentDemo />
  </TooltipProvider>
);

export default App;
