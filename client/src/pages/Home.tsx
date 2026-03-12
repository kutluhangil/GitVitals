import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, GitCompare, ArrowRight, BarChart3, User, GitMerge } from "lucide-react";
import { GitAnimation } from "@/components/GitAnimation";
import { Dashboard } from "@/components/Dashboard";
import { CompareView } from "@/components/CompareView";
import { useAnalyzeRepo, useCompareRepos } from "@/hooks/use-analyze";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";

const T = {
  en: {
    badge: "Repository Health Analytics",
    title: "GitVitals",
    subtitle: "Understand GitHub repositories and developers in seconds.",
    description: "Analyze repositories, measure developer activity, detect tech stacks, and compare projects — all in one place.",
    placeholder: "Paste a GitHub repository or profile URL",
    examples: "Try: github.com/vercel/next.js · github.com/torvalds",
    analyzeBtn: "Analyze",
    compareMode: "Compare Repos",
    analyzeMode: "Analyze",
    compareTitle: "Compare two repositories side by side.",
    compareDesc: "Get a detailed side-by-side breakdown of stars, contributors, health scores, tech stack, and more.",
    placeholderA: "github.com/facebook/react",
    placeholderB: "github.com/vuejs/vue",
    compareBtn: "Compare",
    feat1Title: "Repo Analyzer",
    feat1Desc: "Health scores, commit history, contributors, language distribution, and risk analysis.",
    feat2Title: "Developer Insights",
    feat2Desc: "Developer score, language expertise, portfolio overview, and a shareable developer card.",
    feat3Title: "Project Comparison",
    feat3Desc: "Side-by-side metrics: stars, forks, activity, tech stack, and risk score.",
    newSearch: "Analyze another",
    backStart: "Back to start",
    loading: ["Fetching from GitHub...", "Analyzing activity...", "Calculating scores...", "Detecting tech stack...", "Generating insights..."],
    compareLoading: ["Fetching both repositories...", "Comparing metrics...", "Building side-by-side analysis...", "Generating comparison..."],
  },
  tr: {
    badge: "Repository Sağlık Analizi",
    title: "GitVitals",
    subtitle: "GitHub repolarını ve geliştiricileri saniyeler içinde anlayın.",
    description: "Repoları analiz edin, geliştirici aktivitesini ölçün, tech stack'i tespit edin ve projeleri karşılaştırın.",
    placeholder: "GitHub repo veya profil URL'si yapıştırın",
    examples: "Örnek: github.com/vercel/next.js · github.com/torvalds",
    analyzeBtn: "Analiz Et",
    compareMode: "Karşılaştır",
    analyzeMode: "Analiz Et",
    compareTitle: "İki repoyu yan yana karşılaştırın.",
    compareDesc: "Yıldızlar, katkıcılar, sağlık skoru, tech stack ve daha fazlasını detaylıca karşılaştırın.",
    placeholderA: "github.com/facebook/react",
    placeholderB: "github.com/vuejs/vue",
    compareBtn: "Karşılaştır",
    feat1Title: "Repo Analizörü",
    feat1Desc: "Sağlık skoru, commit geçmişi, katkıcılar, dil dağılımı ve risk analizi.",
    feat2Title: "Geliştirici Analizi",
    feat2Desc: "Developer skoru, dil uzmanlığı, portföy özeti ve paylaşılabilir geliştirici kartı.",
    feat3Title: "Proje Karşılaştırma",
    feat3Desc: "Yan yana metrikler: yıldızlar, fork'lar, aktivite, tech stack ve risk skoru.",
    newSearch: "Başka birini analiz et",
    backStart: "Başa dön",
    loading: ["GitHub'dan alınıyor...", "Aktivite analiz ediliyor...", "Skorlar hesaplanıyor...", "Tech stack tespit ediliyor...", "İçgörüler üretiliyor..."],
    compareLoading: ["Her iki repo alınıyor...", "Metrikler karşılaştırılıyor...", "Yan yana analiz hazırlanıyor...", "Karşılaştırma oluşturuluyor..."],
  },
};

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (trimmed.startsWith("http")) return trimmed;
  return `https://github.com/${trimmed.replace(/^github\.com\//, "")}`;
}

const FEATURES = (t: typeof T.en) => [
  { icon: <BarChart3 className="w-5 h-5" />, title: t.feat1Title, desc: t.feat1Desc },
  { icon: <User className="w-5 h-5" />, title: t.feat2Title, desc: t.feat2Desc },
  { icon: <GitMerge className="w-5 h-5" />, title: t.feat3Title, desc: t.feat3Desc },
];

export default function Home() {
  const { theme, toggleTheme, lang, setLang } = useApp();
  const t = T[lang];

  const [mode, setMode] = useState<"analyze" | "compare">("analyze");
  const [inputUrl, setInputUrl] = useState("");
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [compareUrls, setCompareUrls] = useState<{ a: string; b: string } | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const { toast } = useToast();

  const { data, isLoading, error } = useAnalyzeRepo(submittedUrl);
  const { data: compareData, isLoading: isComparing, error: compareError } = useCompareRepos(
    compareUrls?.a ?? null, compareUrls?.b ?? null
  );

  const isAnyLoading = isLoading || isComparing;
  const hasResult = (!isLoading && !!data) || (!isComparing && !!compareData);
  const steps = mode === "compare" ? t.compareLoading : t.loading;

  useEffect(() => {
    if (!isAnyLoading) return;
    const id = setInterval(() => setLoadingStep(p => (p + 1) % steps.length), 2200);
    return () => clearInterval(id);
  }, [isAnyLoading, steps.length]);

  useEffect(() => {
    if (error) { toast({ title: "Analysis Failed", description: error.message, variant: "destructive" }); setSubmittedUrl(null); }
  }, [error, toast]);
  useEffect(() => {
    if (compareError) { toast({ title: "Comparison Failed", description: compareError.message, variant: "destructive" }); setCompareUrls(null); }
  }, [compareError, toast]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setSubmittedUrl(normalizeUrl(inputUrl));
    setCompareUrls(null);
    setLoadingStep(0);
  };

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlA.trim() || !urlB.trim()) {
      toast({ title: "Two URLs required", variant: "destructive" });
      return;
    }
    setCompareUrls({ a: normalizeUrl(urlA), b: normalizeUrl(urlB) });
    setSubmittedUrl(null);
    setLoadingStep(0);
  };

  const reset = () => {
    setSubmittedUrl(null);
    setCompareUrls(null);
    setInputUrl("");
    setUrlA("");
    setUrlB("");
  };

  const switchMode = (m: "analyze" | "compare") => { setMode(m); reset(); };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <button onClick={reset} className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--background))"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">GitVitals</span>
          </button>

          <nav className="hidden sm:flex items-center gap-1">
            <button onClick={() => switchMode("analyze")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "analyze" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
              {t.analyzeMode}
            </button>
            <button onClick={() => switchMode("compare")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${mode === "compare" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
              <GitCompare className="w-3.5 h-3.5" />
              {t.compareMode}
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border overflow-hidden">
              <button onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${lang === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                EN
              </button>
              <button onClick={() => setLang("tr")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${lang === "tr" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                TR
              </button>
            </div>
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 pt-14">

        <AnimatePresence mode="wait">
          {!hasResult && !isAnyLoading && (
            <motion.div key="hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}>

              <div className="relative flex flex-col items-center text-center pt-24 pb-10">
                <div className="absolute inset-x-0 top-0 hero-glow pointer-events-none h-[500px]" aria-hidden />

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-muted-foreground text-xs font-medium mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {t.badge}
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none text-foreground mb-5"
                  style={{ letterSpacing: '-0.04em' }}>
                  {t.title}
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl sm:text-2xl font-medium text-foreground/80 mb-4 max-w-xl text-balance">
                  {mode === "compare" ? t.compareTitle : t.subtitle}
                </motion.p>

                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm sm:text-base text-muted-foreground mb-10 max-w-md text-balance">
                  {mode === "compare" ? t.compareDesc : t.description}
                </motion.p>

                {mode === "analyze" ? (
                  <motion.form onSubmit={handleAnalyze} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }} className="w-full max-w-lg">
                    <div className="relative flex items-center border border-border rounded-2xl bg-card shadow-sm overflow-hidden focus-within:border-foreground/30 focus-within:ring-4 focus-within:ring-foreground/5 transition-all">
                      <Search className="w-4 h-4 text-muted-foreground ml-4 flex-shrink-0" />
                      <input type="text" value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                        placeholder={t.placeholder}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-3.5 px-3 text-sm"
                        required />
                      <button type="submit"
                        className="flex items-center gap-1.5 mr-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
                        {t.analyzeBtn} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">{t.examples}</p>
                  </motion.form>
                ) : (
                  <motion.form onSubmit={handleCompare} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }} className="w-full max-w-2xl space-y-3">
                    <div className="flex items-center border border-border rounded-2xl bg-card shadow-sm overflow-hidden focus-within:border-foreground/30 focus-within:ring-4 focus-within:ring-foreground/5 transition-all">
                      <span className="ml-4 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center flex-shrink-0">A</span>
                      <input type="text" value={urlA} onChange={e => setUrlA(e.target.value)}
                        placeholder={t.placeholderA}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-3.5 px-3 text-sm" required />
                    </div>
                    <div className="flex items-center border border-border rounded-2xl bg-card shadow-sm overflow-hidden focus-within:border-foreground/30 focus-within:ring-4 focus-within:ring-foreground/5 transition-all">
                      <span className="ml-4 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">B</span>
                      <input type="text" value={urlB} onChange={e => setUrlB(e.target.value)}
                        placeholder={t.placeholderB}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-3.5 px-3 text-sm" required />
                    </div>
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
                      <GitCompare className="w-4 h-4" /> {t.compareBtn}
                    </button>
                  </motion.form>
                )}
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="py-4">
                <GitAnimation />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-16">
                {FEATURES(t).map((f, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors mb-4">
                      {f.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnyLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="relative w-14 h-14 mb-8">
                <div className="absolute inset-0 rounded-full border border-border" />
                <motion.div className="absolute inset-0 rounded-full border border-foreground/30 border-t-foreground"
                  animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.p key={loadingStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} className="text-base font-medium text-foreground/70">
                  {steps[loadingStep]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasResult && !isAnyLoading && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>

              <div className="pt-20 pb-8">
                {mode === "analyze" ? (
                  <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto flex items-center gap-2">
                    <div className="flex-1 flex items-center border border-border rounded-2xl bg-card px-4 gap-2 focus-within:border-foreground/30 transition-all">
                      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <input type="text" value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                        placeholder={t.placeholder}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-2.5 text-sm" />
                    </div>
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
                      {t.analyzeBtn}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCompare} className="max-w-3xl mx-auto flex gap-2 items-stretch">
                    <div className="flex-1 flex items-center border border-border rounded-2xl bg-card px-3 gap-2 focus-within:border-foreground/30 transition-all">
                      <span className="w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center flex-shrink-0">A</span>
                      <input type="text" value={urlA} onChange={e => setUrlA(e.target.value)}
                        placeholder={t.placeholderA}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-2.5 text-sm" />
                    </div>
                    <div className="flex-1 flex items-center border border-border rounded-2xl bg-card px-3 gap-2 focus-within:border-primary/30 transition-all">
                      <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">B</span>
                      <input type="text" value={urlB} onChange={e => setUrlB(e.target.value)}
                        placeholder={t.placeholderB}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-2.5 text-sm" />
                    </div>
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 flex-shrink-0">
                      <GitCompare className="w-4 h-4" /> {t.compareBtn}
                    </button>
                  </form>
                )}
              </div>

              {data && <Dashboard data={data} />}
              {compareData && <CompareView data={compareData} />}

              <div className="py-10 text-center">
                <button onClick={reset}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5 mx-auto">
                  ← {t.backStart}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
