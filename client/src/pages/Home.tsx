import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Github, GitCompare } from "lucide-react";
import { HeartbeatAnimation } from "@/components/HeartbeatAnimation";
import { Dashboard } from "@/components/Dashboard";
import { CompareView } from "@/components/CompareView";
import { useAnalyzeRepo, useCompareRepos } from "@/hooks/use-analyze";
import { useToast } from "@/hooks/use-toast";

const LOADING_STEPS = [
  "Fetching data from GitHub...",
  "Analyzing activity and metrics...",
  "Calculating health & risk scores...",
  "Detecting tech stack...",
  "Generating final insights...",
];

function validateGitHubUrl(url: string) {
  return url.includes("github.com") || /^[a-z0-9-]+\/[a-z0-9._-]+$/i.test(url) || /^[a-z0-9-]+$/i.test(url);
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.includes("/")) return `https://github.com/${trimmed}`;
  return trimmed;
}

export default function Home() {
  const [mode, setMode] = useState<'analyze' | 'compare'>('analyze');
  const [inputUrl, setInputUrl] = useState("");
  const [compareUrlA, setCompareUrlA] = useState("");
  const [compareUrlB, setCompareUrlB] = useState("");
  const [submittedUrl, setSubmitUrl] = useState<string | null>(null);
  const [compareUrls, setCompareUrls] = useState<{ a: string; b: string } | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const { toast } = useToast();

  const { data, isLoading, error } = useAnalyzeRepo(submittedUrl);
  const { data: compareData, isLoading: isComparing, error: compareError } = useCompareRepos(
    compareUrls?.a ?? null,
    compareUrls?.b ?? null
  );

  const isAnyLoading = isLoading || isComparing;
  const hasResult = (!isLoading && data) || (!isComparing && compareData);

  useEffect(() => {
    if (!isAnyLoading) return;
    const interval = setInterval(() => setLoadingStepIdx((p) => (p + 1) % LOADING_STEPS.length), 2000);
    return () => clearInterval(interval);
  }, [isAnyLoading]);

  useEffect(() => {
    if (error) {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
      setSubmitUrl(null);
    }
  }, [error, toast]);

  useEffect(() => {
    if (compareError) {
      toast({ title: "Comparison Failed", description: compareError.message, variant: "destructive" });
      setCompareUrls(null);
    }
  }, [compareError, toast]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!validateGitHubUrl(trimmed)) {
      toast({ title: "Invalid URL", description: "Please enter a valid GitHub repository or profile URL.", variant: "destructive" });
      return;
    }
    const url = normalizeUrl(trimmed);
    setSubmitUrl(url);
    setCompareUrls(null);
    setLoadingStepIdx(0);
  };

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    const a = compareUrlA.trim();
    const b = compareUrlB.trim();
    if (!a || !b) {
      toast({ title: "Two URLs required", description: "Please enter both repository URLs to compare.", variant: "destructive" });
      return;
    }
    setCompareUrls({ a: normalizeUrl(a), b: normalizeUrl(b) });
    setSubmitUrl(null);
    setLoadingStepIdx(0);
  };

  const resetAll = () => {
    setSubmitUrl(null);
    setCompareUrls(null);
    setInputUrl("");
    setCompareUrlA("");
    setCompareUrlB("");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-grid-pattern">
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={resetAll} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ActivityIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">GitVitals</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('analyze'); resetAll(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === 'analyze' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white'}`}
            >
              Analyze
            </button>
            <button
              onClick={() => { setMode('compare'); resetAll(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${mode === 'compare' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white'}`}
            >
              <GitCompare className="w-4 h-4" />Compare
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors ml-2">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">

        <AnimatePresence mode="wait">
          {!hasResult && !isAnyLoading && (
            <motion.div key="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.5 }}
              className="flex flex-col lg:flex-row items-center gap-16 min-h-[60vh]">
              <div className="flex-1 text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Vitals API v2.0 is live
                </div>

                {mode === 'analyze' ? (
                  <>
                    <h1 className="text-5xl lg:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-6 text-glow">
                      Understand any GitHub repository{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">in seconds.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0">
                      Analyze any GitHub repository or developer profile to get health scores, risk analysis, tech stack detection, and more.
                    </p>
                    <form onSubmit={handleAnalyze} className="relative max-w-xl mx-auto lg:mx-0 group">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative flex items-center bg-card border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                        <div className="pl-4 pr-2 text-muted-foreground"><Search className="w-5 h-5" /></div>
                        <input type="text" placeholder="github.com/facebook/react or github.com/gaearon"
                          value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
                          className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-3 text-base" required />
                        <button type="submit"
                          className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                          Analyze <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h1 className="text-5xl lg:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-6 text-glow">
                      Compare two repositories{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary">side by side.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0">
                      Compare stars, forks, health scores, risk levels, contributors, tech stack and more between two GitHub repos.
                    </p>
                    <form onSubmit={handleCompare} className="relative max-w-xl mx-auto lg:mx-0 space-y-3">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center bg-card border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-primary/50 transition-all">
                          <div className="pl-4 pr-2">
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">A</span>
                          </div>
                          <input type="text" placeholder="github.com/facebook/react"
                            value={compareUrlA} onChange={(e) => setCompareUrlA(e.target.value)}
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-3 text-base" required />
                        </div>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center bg-card border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-purple-500/50 transition-all">
                          <div className="pl-4 pr-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white">B</span>
                          </div>
                          <input type="text" placeholder="github.com/vuejs/vue"
                            value={compareUrlB} onChange={(e) => setCompareUrlB(e.target.value)}
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-3 text-base" required />
                        </div>
                      </div>
                      <button type="submit"
                        className="w-full px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                        <GitCompare className="w-4 h-4" /> Compare Repositories
                      </button>
                    </form>
                  </>
                )}
              </div>
              <div className="flex-1 w-full relative">
                <HeartbeatAnimation />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnyLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32">
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <motion.div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
                  animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ActivityIcon className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <motion.div key={loadingStepIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} className="text-xl font-display font-medium text-foreground text-center">
                {LOADING_STEPS[loadingStepIdx]}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasResult && !isAnyLoading && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}>

              <div className="mb-10">
                {mode === 'analyze' ? (
                  <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto group">
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 shadow-xl focus-within:border-primary/40 transition-all">
                      <div className="pl-4 pr-2 text-muted-foreground"><Search className="w-4 h-4" /></div>
                      <input type="text" placeholder="Analyze another repo or profile..."
                        value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
                        className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-2 text-sm" required />
                      <button type="submit"
                        className="px-4 py-2 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 text-sm transition-all">
                        Analyze
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCompare} className="relative max-w-3xl mx-auto flex gap-3">
                    <div className="flex-1 flex items-center bg-card/50 border border-white/10 rounded-2xl p-1.5 focus-within:border-primary/40 transition-all">
                      <span className="pl-3 pr-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">A</span>
                      <input type="text" placeholder="Repo A URL..." value={compareUrlA}
                        onChange={(e) => setCompareUrlA(e.target.value)}
                        className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-2 px-2 text-sm" />
                    </div>
                    <div className="flex-1 flex items-center bg-card/50 border border-white/10 rounded-2xl p-1.5 focus-within:border-purple-500/40 transition-all">
                      <span className="pl-3 pr-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">B</span>
                      <input type="text" placeholder="Repo B URL..." value={compareUrlB}
                        onChange={(e) => setCompareUrlB(e.target.value)}
                        className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none py-2 px-2 text-sm" />
                    </div>
                    <button type="submit"
                      className="px-4 py-2 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 text-sm transition-all flex-shrink-0">
                      <GitCompare className="w-4 h-4" /> Compare
                    </button>
                  </form>
                )}
              </div>

              {data && <Dashboard data={data} />}
              {compareData && <CompareView data={compareData} />}

              <div className="mt-10 text-center">
                <button onClick={resetAll}
                  className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2 mx-auto text-sm">
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

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
