import { useRef } from "react";
import { motion } from "framer-motion";
import { Star, GitFork, BookOpen, Users, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface DeveloperCardProps {
  data: any;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3776ab",
  Go: "#00add8", Rust: "#ce412b", Java: "#b07219", "C#": "#178600",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF",
  Dart: "#00b4ab", "C++": "#f34b7d", CSS: "#563d7c", HTML: "#e34c26",
  Shell: "#89e051", Vue: "#41b883", Scala: "#c22d40",
};

function getLangColor(lang: string) {
  return LANG_COLORS[lang] || "#6366f1";
}

function getScoreColor(score: number) {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#4f46e5";
  if (score >= 50) return "#f59e0b";
  if (score >= 25) return "#ef4444";
  return "#6b7280";
}

export function DeveloperCard({ data }: DeveloperCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const score = data.developerScore?.score ?? 0;
  const level = data.developerScore?.level ?? "Developer";
  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: "#0f0f0f",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${data.overview.username}-gitvitals-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Card downloaded!", description: "Your developer card has been saved." });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const text = `My GitVitals Developer Score: ${score}/100 (${level}) — Check yours at GitVitals!`;
    if (navigator.share) {
      await navigator.share({ title: "GitVitals Developer Card", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!", description: "Share your score anywhere." });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-3xl p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold font-display tracking-wide flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Shareable Developer Card
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-card border border-white/10 hover:border-primary/30 text-sm font-medium flex items-center gap-1.5 transition-all text-muted-foreground hover:text-white"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-sm font-medium flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-[380px] rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f23 50%, #1a0a2e 100%)", border: "1px solid rgba(79,70,229,0.3)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/5 rounded-full translate-y-24 -translate-x-24 pointer-events-none" />

          <div className="flex items-start justify-between mb-5 relative">
            <div className="flex items-center gap-3">
              <img
                src={data.overview.avatarUrl}
                alt={data.overview.username}
                className="w-14 h-14 rounded-full border-2 border-primary/30"
                crossOrigin="anonymous"
              />
              <div>
                <p className="font-bold text-white text-lg leading-tight">{data.overview.name || data.overview.username}</p>
                <p className="text-sm text-white/50">@{data.overview.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">GitVitals</p>
              <p className="text-[9px] text-white/20 font-mono mt-0.5">gitvitals.dev</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-5 relative">
            <div className="relative flex-shrink-0">
              <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  style={{ filter: `drop-shadow(0 0 6px ${scoreColor}60)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>{score}</span>
                <span className="text-[9px] text-white/40 font-mono">/100</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold mb-2 font-mono"
                style={{ backgroundColor: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}
              >
                {level}
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-mono">Repos</p>
                  <p className="text-sm font-bold text-white font-mono">{data.overview.publicRepos}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-mono">Stars</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {data.portfolio?.totalStars >= 1000
                      ? `${(data.portfolio.totalStars / 1000).toFixed(1)}k`
                      : data.portfolio?.totalStars ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-mono">Followers</p>
                  <p className="text-sm font-bold text-white font-mono">{data.overview.followers}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-mono">Forks</p>
                  <p className="text-sm font-bold text-white font-mono">{data.portfolio?.totalForks ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {data.languageExpertise && data.languageExpertise.length > 0 && (
            <div className="relative">
              <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest mb-2">Top Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {data.languageExpertise.slice(0, 4).map((lang: any) => (
                  <span
                    key={lang.name}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono"
                    style={{ backgroundColor: `${getLangColor(lang.name)}15`, color: getLangColor(lang.name), border: `1px solid ${getLangColor(lang.name)}30` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getLangColor(lang.name) }} />
                    {lang.name} {lang.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
