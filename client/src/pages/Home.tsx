import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Github } from "lucide-react";
import { HeartbeatAnimation } from "@/components/HeartbeatAnimation";
import { Dashboard } from "@/components/Dashboard";
import { useAnalyzeRepo } from "@/hooks/use-analyze";
import { useToast } from "@/hooks/use-toast";

const LOADING_STEPS = [
  "Fetching data from GitHub...",
  "Analyzing activity and metrics...",
  "Calculating health score...",
  "Generating final insights...",
];

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [submittedUrl, setSubmitUrl] = useState<string | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  
  const { data, isLoading, error } = useAnalyzeRepo(submittedUrl);
  const { toast } = useToast();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    
    // Accept both github.com/owner/repo and github.com/username formats
    if (!trimmedUrl.includes("github.com")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid GitHub repository or profile URL (e.g., github.com/facebook/react or github.com/gaearon).",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitUrl(trimmedUrl);
    setLoadingStepIdx(0);
  };

  // Cycle through loading text
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle errors showing as toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
      setSubmitUrl(null); // Reset to allow retry
    }
  }, [error, toast]);

  // Mock data for initial preview when no URL is submitted yet
  // In a real app we might just show the hero, but the prompt asks for a stunning UI.
  // We'll reveal the dashboard ONLY after fetch.

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-grid-pattern">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ActivityIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">GitVitals</span>
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {!data && !isLoading && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col lg:flex-row items-center gap-16 min-h-[60vh]"
            >
              <div className="flex-1 text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Vitals API v2.0 is live
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-6 text-glow">
                  Understand any GitHub repository <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">in seconds.</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0">
                  Analyze any GitHub repository or developer profile to get detailed insights and metrics instantly.
                </p>

                <form onSubmit={handleAnalyze} className="relative max-w-xl mx-auto lg:mx-0 group">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center bg-card border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                    <div className="pl-4 pr-2 text-muted-foreground">
                      <Search className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="https://github.com/facebook/react or https://github.com/gaearon" 
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-3 text-lg"
                      required
                    />
                    <button 
                      type="submit"
                      className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      Analyze <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="flex-1 w-full relative">
                <HeartbeatAnimation />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <motion.div 
                  className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ActivityIcon className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              
              <motion.div
                key={loadingStepIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xl font-display font-medium text-foreground text-center h-8"
              >
                {LOADING_STEPS[loadingStepIdx]}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Reveal */}
        <AnimatePresence>
          {data && !isLoading && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="mb-12">
                <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto group">
                  <div className="absolute inset-0 bg-primary/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 shadow-xl focus-within:border-primary/40 transition-all">
                    <div className="pl-4 pr-2 text-muted-foreground">
                      <Search className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Analyze another repo or profile..." 
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-2 text-sm"
                      required
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-2 text-sm transition-all"
                    >
                      Analyze
                    </button>
                  </div>
                </form>
              </div>

              <Dashboard data={data} />
              
              <div className="mt-12 text-center">
                <button 
                  onClick={() => {
                    setSubmitUrl(null);
                    setInputUrl("");
                  }}
                  className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2 mx-auto text-sm"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to start
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

// Simple Activity SVG for logo
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
