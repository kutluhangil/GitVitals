import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Layers, Sparkles, Minimize2, ImageDown } from "lucide-react";
import html2canvas from "html2canvas";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";

interface DeveloperCardProps { data: any; }

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3776ab",
  Go: "#00add8", Rust: "#ce412b", Java: "#b07219", "C#": "#178600",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF",
  Dart: "#00b4ab", "C++": "#f34b7d", CSS: "#563d7c", HTML: "#e34c26",
  Shell: "#89e051",
};
const LC = (l: string) => LANG_COLORS[l] || "#6366f1";

function scoreColor(s: number) {
  if (s >= 90) return "#10b981";
  if (s >= 75) return "#4f46e5";
  if (s >= 50) return "#f59e0b";
  if (s >= 25) return "#ef4444";
  return "#6b7280";
}

const T = {
  en: {
    title: "Shareable Developer Card",
    share: "Share",
    download: "Download PNG",
    downloadGif: "Download GIF",
    detailed: "Detailed",
    premium: "Premium",
    minimal: "Minimal",
    repos: "REPOS",
    stars: "STARS",
    followers: "FOLLOWERS",
    forks: "FORKS",
    following: "FOLLOWING",
    since: "MEMBER SINCE",
    topLangs: "TOP LANGUAGES",
    topRepos: "TOP REPOS",
    score: "DEVELOPER SCORE",
    generating: "Generating GIF…",
  },
  tr: {
    title: "Paylaşılabilir Geliştirici Kartı",
    share: "Paylaş",
    download: "PNG İndir",
    downloadGif: "GIF İndir",
    detailed: "Detaylı",
    premium: "Premium",
    minimal: "Minimalist",
    repos: "REPO",
    stars: "YILDIZ",
    followers: "TAKİPÇİ",
    forks: "FORK",
    following: "TAKİP",
    since: "ÜYELİK",
    topLangs: "DİLLER",
    topRepos: "EN İYİ REPOLAR",
    score: "GELİŞTİRİCİ SKORU",
    generating: "GIF oluşturuluyor…",
  },
};

// ─────────────────────────────────────────────
// CARD 1 · DETAILED
// ─────────────────────────────────────────────
function DetailedCard({ data, t }: { data: any; t: typeof T.en }) {
  const score = data.developerScore?.score ?? 0;
  const level = data.developerScore?.level ?? "";
  const sc = scoreColor(score);
  const circ = 2 * Math.PI * 36;
  const offset = circ - (score / 100) * circ;
  const langs = (data.languageExpertise || []).slice(0, 4);
  const repos = (data.topRepos || []).slice(0, 2);
  const since = data.overview?.createdAt
    ? new Date(data.overview.createdAt).getFullYear()
    : "—";

  return (
    <div
      style={{
        width: 420,
        background: "linear-gradient(135deg,#0d1117 0%,#161b22 60%,#0d1117 100%)",
        border: "1px solid #30363d",
        borderRadius: 16,
        padding: 24,
        fontFamily: "'JetBrains Mono', monospace, sans-serif",
        color: "#e6edf3",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* BG Blobs */}
      <div style={{ position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:`${sc}08`,pointerEvents:"none" }} />
      <div style={{ position:"absolute",bottom:-30,left:-20,width:120,height:120,borderRadius:"50%",background:"#6366f110",pointerEvents:"none" }} />

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18 }}>
        <div style={{ display:"flex",gap:12,alignItems:"center" }}>
          <img src={data.overview.avatarUrl} alt="" crossOrigin="anonymous"
            style={{ width:52,height:52,borderRadius:"50%",border:`2px solid ${sc}50` }} />
          <div>
            <p style={{ fontWeight:700,fontSize:16,color:"#f0f6fc",marginBottom:2 }}>{data.overview.name || data.overview.username}</p>
            <p style={{ fontSize:11,color:"#8b949e" }}>@{data.overview.username}</p>
            {data.overview.bio && (
              <p style={{ fontSize:10,color:"#6e7681",marginTop:4,maxWidth:200,lineHeight:1.4 }}>
                {data.overview.bio.slice(0,60)}{data.overview.bio.length>60?"…":""}
              </p>
            )}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:9,color:"#484f58",textTransform:"uppercase",letterSpacing:2,fontWeight:700 }}>GitVitals</p>
          <p style={{ fontSize:8,color:"#30363d",marginTop:2 }}>gitvitals.vercel.app</p>
        </div>
      </div>

      {/* Score row */}
      <div style={{ display:"flex",gap:16,alignItems:"center",marginBottom:18,padding:"14px 16px",background:"#161b22",borderRadius:10,border:"1px solid #21262d" }}>
        <div style={{ position:"relative",width:80,height:80,flexShrink:0 }}>
          <svg width={80} height={80} viewBox="0 0 80 80" style={{ transform:"rotate(-90deg)" }}>
            <circle cx={40} cy={40} r={36} fill="none" stroke="#21262d" strokeWidth={6} />
            <circle cx={40} cy={40} r={36} fill="none" stroke={sc} strokeWidth={6}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ filter:`drop-shadow(0 0 4px ${sc}80)` }} />
          </svg>
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
            <span style={{ fontSize:20,fontWeight:700,color:sc }}>{score}</span>
            <span style={{ fontSize:8,color:"#484f58" }}>/100</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ marginBottom:8 }}>
            <span style={{ fontSize:10,padding:"3px 10px",borderRadius:4,fontWeight:700,border:`1px solid ${sc}40`,backgroundColor:`${sc}15`,color:sc }}>{level}</span>
          </div>
          <p style={{ fontSize:9,color:"#484f58",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6 }}>{t.score}</p>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6 }}>
            {[
              [t.repos, data.overview.publicRepos],
              [t.stars, data.portfolio?.totalStars ?? 0],
              [t.followers, data.overview.followers],
              [t.forks, data.portfolio?.totalForks ?? 0],
              [t.following, data.overview.following],
              [t.since, since],
            ].map(([label, val]) => (
              <div key={String(label)}>
                <p style={{ fontSize:8,color:"#484f58",textTransform:"uppercase",letterSpacing:1 }}>{label}</p>
                <p style={{ fontSize:13,fontWeight:700,color:"#f0f6fc" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Languages */}
      {langs.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <p style={{ fontSize:8,color:"#484f58",textTransform:"uppercase",letterSpacing:2,marginBottom:8 }}>{t.topLangs}</p>
          {langs.map((l: any) => (
            <div key={l.name} style={{ marginBottom:5 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                <span style={{ fontSize:10,color:LC(l.name) }}>{l.name}</span>
                <span style={{ fontSize:10,color:"#484f58" }}>{l.percentage}%</span>
              </div>
              <div style={{ height:3,background:"#21262d",borderRadius:2,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${l.percentage}%`,background:LC(l.name),borderRadius:2,filter:`drop-shadow(0 0 3px ${LC(l.name)}60)` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Repos */}
      {repos.length > 0 && (
        <div>
          <p style={{ fontSize:8,color:"#484f58",textTransform:"uppercase",letterSpacing:2,marginBottom:8 }}>{t.topRepos}</p>
          {repos.map((r: any) => (
            <div key={r.name} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #21262d" }}>
              <span style={{ fontSize:11,color:"#e6edf3",fontWeight:600 }}>{r.name}</span>
              <span style={{ fontSize:10,color:"#f1e05a8c" }}>⭐ {r.stars}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD 2 · PREMIUM (glassmorphism + mesh)
// ─────────────────────────────────────────────
function PremiumCard({ data, t }: { data: any; t: typeof T.en }) {
  const score = data.developerScore?.score ?? 0;
  const level = data.developerScore?.level ?? "";
  const sc = scoreColor(score);
  const circ = 2 * Math.PI * 50;
  const offset = circ - (score / 100) * circ;
  const langs = (data.languageExpertise || []).slice(0, 5);

  return (
    <div style={{
      width: 420,
      borderRadius: 20,
      padding: 2,
      background: `linear-gradient(135deg, ${sc}60, #6366f160, #ec489960)`,
      fontFamily: "system-ui, sans-serif",
      position: "relative",
    }}>
      <div style={{
        borderRadius: 18,
        padding: 28,
        background: "linear-gradient(145deg, rgba(13,13,30,0.97) 0%, rgba(25,10,45,0.97) 100%)",
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Mesh gradient orbs */}
        <div style={{ position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle, ${sc}25 0%, transparent 70%)`,pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle, #6366f120 0%, transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, #ec489908 0%, transparent 70%)",pointerEvents:"none" }} />

        {/* Top */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22 }}>
          <div style={{ display:"flex",gap:14,alignItems:"center" }}>
            <div style={{ width:56,height:56,borderRadius:"50%",padding:2,background:`linear-gradient(135deg,${sc},#6366f1)` }}>
              <img src={data.overview.avatarUrl} alt="" crossOrigin="anonymous"
                style={{ width:52,height:52,borderRadius:"50%",display:"block" }} />
            </div>
            <div>
              <p style={{ fontSize:18,fontWeight:800,color:"#ffffff",letterSpacing:-0.5,marginBottom:2 }}>{data.overview.name || data.overview.username}</p>
              <p style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>@{data.overview.username}</p>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:8,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",letterSpacing:3 }}>GitVitals</p>
            <div style={{ marginTop:4,padding:"2px 8px",borderRadius:4,border:"1px solid rgba(255,255,255,0.08)",fontSize:8,color:"rgba(255,255,255,0.2)" }}>
              gitvitals.vercel.app
            </div>
          </div>
        </div>

        {/* Score center piece */}
        <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:24,marginBottom:22 }}>
          <div style={{ position:"relative",width:110,height:110 }}>
            <svg width={110} height={110} viewBox="0 0 110 110" style={{ transform:"rotate(-90deg)" }}>
              <circle cx={55} cy={55} r={50} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
              <circle cx={55} cy={55} r={50} fill="none" stroke={`url(#grad)`} strokeWidth={8}
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ filter:`drop-shadow(0 0 10px ${sc}80)` }} />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={sc} />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontSize:30,fontWeight:900,color:"#fff",lineHeight:1 }}>{score}</span>
              <span style={{ fontSize:9,color:"rgba(255,255,255,0.3)" }}>/ 100</span>
            </div>
          </div>

          <div>
            <div style={{ marginBottom:10,padding:"4px 14px",borderRadius:20,border:`1px solid ${sc}50`,background:`${sc}15`,display:"inline-block" }}>
              <span style={{ fontSize:12,fontWeight:700,color:sc,letterSpacing:0.5 }}>{level}</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[
                [data.overview.publicRepos, t.repos],
                [data.portfolio?.totalStars ?? 0, t.stars],
                [data.overview.followers, t.followers],
                [data.portfolio?.totalForks ?? 0, t.forks],
              ].map(([v,l]) => (
                <div key={String(l)} style={{ textAlign:"center",padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize:18,fontWeight:800,color:"#fff",lineHeight:1 }}>{v}</p>
                  <p style={{ fontSize:8,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1.5,marginTop:2 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Languages */}
        {langs.length > 0 && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:16 }}>
            <p style={{ fontSize:8,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",letterSpacing:3,marginBottom:10 }}>{t.topLangs}</p>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {langs.map((l: any) => (
                <div key={l.name} style={{
                  display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:6,
                  background:`${LC(l.name)}12`,border:`1px solid ${LC(l.name)}30`
                }}>
                  <span style={{ width:6,height:6,borderRadius:"50%",background:LC(l.name),flexShrink:0,boxShadow:`0 0 4px ${LC(l.name)}` }} />
                  <span style={{ fontSize:10,fontWeight:600,color:LC(l.name) }}>{l.name}</span>
                  <span style={{ fontSize:9,color:"rgba(255,255,255,0.3)" }}>{l.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD 3 · MINIMAL
// ─────────────────────────────────────────────
function MinimalCard({ data, t }: { data: any; t: typeof T.en }) {
  const score = data.developerScore?.score ?? 0;
  const level = data.developerScore?.level ?? "";
  const sc = scoreColor(score);
  const langs = (data.languageExpertise || []).slice(0, 5);

  return (
    <div style={{
      width: 360,
      background: "#ffffff",
      borderRadius: 14,
      padding: "22px 24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      color: "#1a1a1a",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    }}>
      {/* Top row */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <img src={data.overview.avatarUrl} alt="" crossOrigin="anonymous"
            style={{ width:40,height:40,borderRadius:"50%",border:"1.5px solid #e5e7eb" }} />
          <div>
            <p style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:1 }}>{data.overview.name || data.overview.username}</p>
            <p style={{ fontSize:11,color:"#9ca3af" }}>@{data.overview.username}</p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:20,fontWeight:900,color:sc }}>{score}</div>
          <div style={{ fontSize:9,color:"#9ca3af",marginTop:1 }}>{level}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height:1,background:"#f3f4f6",marginBottom:14 }} />

      {/* Stats row */}
      <div style={{ display:"flex",gap:0,marginBottom:16 }}>
        {[
          [data.overview.publicRepos, t.repos],
          [data.portfolio?.totalStars ?? 0, t.stars],
          [data.overview.followers, t.followers],
        ].map(([v,l], i, arr) => (
          <div key={String(l)} style={{
            flex:1, textAlign:"center",
            borderRight: i < arr.length-1 ? "1px solid #f3f4f6" : "none",
          }}>
            <p style={{ fontSize:16,fontWeight:800,color:"#111827" }}>{v}</p>
            <p style={{ fontSize:8,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1.2 }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Languages */}
      {langs.length > 0 && (
        <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:14 }}>
          {langs.map((l: any) => (
            <span key={l.name} style={{
              display:"inline-flex",alignItems:"center",gap:4,
              fontSize:10,color:LC(l.name),padding:"2px 7px",borderRadius:4,
              background:`${LC(l.name)}12`,border:`1px solid ${LC(l.name)}25`
            }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:LC(l.name) }} />
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:9,color:"#d1d5db",letterSpacing:1.5,textTransform:"uppercase" }}>GitVitals</span>
        <div style={{ height:2,flex:1,margin:"0 8px",background:`linear-gradient(90deg, ${sc}40, #6366f140)`,borderRadius:1 }} />
        <span style={{ fontSize:9,color:"#d1d5db" }}>gitvitals.vercel.app</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
type Variant = "detailed" | "premium" | "minimal";

const VARIANTS: Variant[] = ["detailed", "premium", "minimal"];
const VARIANT_ICONS = {
  detailed: <Layers className="w-3.5 h-3.5" />,
  premium: <Sparkles className="w-3.5 h-3.5" />,
  minimal: <Minimize2 className="w-3.5 h-3.5" />,
};

export function DeveloperCard({ data }: DeveloperCardProps) {
  const { lang } = useApp();
  const t = T[lang];
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>("premium");
  const [generatingGif, setGeneratingGif] = useState(false);

  const getCardEl = () => cardRef.current?.querySelector("[data-card]") as HTMLElement | null;

  // ── PNG Download ──────────────────────────
  const handleDownloadPng = async () => {
    const el = getCardEl();
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `${data.overview.username}-gitvitals-${variant}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Card downloaded!", description: "PNG saved successfully." });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  // ── Animated GIF Download ─────────────────
  const handleDownloadGif = async () => {
    const el = getCardEl();
    if (!el || generatingGif) return;
    setGeneratingGif(true);
    toast({ title: t.generating, description: "Capturing frames…" });
    try {
      const FRAMES = 20;
      const DELAY  = 6; // ~60ms per frame ≈ 2s loop

      // Capture the base canvas once at scale 2
      const baseCanvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      const W = baseCanvas.width;
      const H = baseCanvas.height;

      const gif = GIFEncoder();
      const offscreen = document.createElement("canvas");
      offscreen.width  = W;
      offscreen.height = H;
      const ctx = offscreen.getContext("2d")!;

      for (let i = 0; i < FRAMES; i++) {
        const progress = i / (FRAMES - 1); // 0→1
        const shimmer  = Math.sin(progress * Math.PI * 2); // -1→1

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(baseCanvas, 0, 0);

        // Overlay a subtle glow shimmer effect
        const cx = W * (0.2 + 0.6 * progress);
        const radius = W * 0.45;
        const grd = ctx.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, radius);
        grd.addColorStop(0, `rgba(99,102,241,${0.06 * (1 + shimmer * 0.5)})`);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        const imageData = ctx.getImageData(0, 0, W, H);
        const palette   = quantize(imageData.data, 256);
        const indexed   = applyPalette(imageData.data, palette);
        gif.writeFrame(indexed, W, H, { palette, delay: DELAY * 10 });
      }
      gif.finish();

      const bytes = gif.bytesView();
      const blob  = new Blob([bytes], { type: "image/gif" });
      const url   = URL.createObjectURL(blob);
      const link  = document.createElement("a");
      link.download = `${data.overview.username}-gitvitals-${variant}.gif`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "GIF downloaded!", description: "Animated GIF saved successfully." });
    } catch (err) {
      console.error(err);
      toast({ title: "GIF export failed", variant: "destructive" });
    } finally {
      setGeneratingGif(false);
    }
  };

  // ── Share ─────────────────────────────────
  const handleShare = async () => {
    const score = data.developerScore?.score ?? 0;
    const level = data.developerScore?.level ?? "";
    const text  = `My GitVitals Developer Score: ${score}/100 (${level}) — Check yours!`;
    if (navigator.share) {
      await navigator.share({ title: "GitVitals Developer Card", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    }
  };

  return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      transition={{ delay:0.4 }} className="glass-card rounded-3xl p-8">

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="font-semibold font-display flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />{t.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Variant Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {VARIANTS.map(v => (
              <button key={v}
                onClick={() => setVariant(v)}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors
                  ${variant === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {VARIANT_ICONS[v]}{t[v]}
              </button>
            ))}
          </div>
          <button onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-card border border-white/10 hover:border-primary/30 text-xs font-medium flex items-center gap-1.5 text-muted-foreground hover:text-white transition-all">
            <Share2 className="w-3.5 h-3.5" />{t.share}
          </button>
          <button onClick={handleDownloadPng}
            className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1.5 transition-all">
            <Download className="w-3.5 h-3.5" />{t.download}
          </button>
          <button onClick={handleDownloadGif} disabled={generatingGif}
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-60">
            <ImageDown className="w-3.5 h-3.5" />
            {generatingGif ? "..." : t.downloadGif}
          </button>
        </div>
      </div>

      {/* Card Preview */}
      <div className="flex justify-center" ref={cardRef}>
        <AnimatePresence mode="wait">
          <motion.div key={variant}
            initial={{ opacity:0, y:8, scale:0.97 }}
            animate={{ opacity:1, y:0,  scale:1 }}
            exit={{    opacity:0, y:-8, scale:0.97 }}
            transition={{ duration:0.25 }}
            data-card>
            {variant === "detailed" && <DetailedCard data={data} t={t} />}
            {variant === "premium"  && <PremiumCard  data={data} t={t} />}
            {variant === "minimal"  && <MinimalCard  data={data} t={t} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-muted-foreground/50 mt-4">
        {variant === "detailed" && (lang === "tr" ? "Detaylı veri görünümü — tüm istatistikler ve dil analizi" : "Information-rich view with all stats, languages & top repos")}
        {variant === "premium"  && (lang === "tr" ? "Premium glassmorphism tasarım — GitHub README için ideal" : "Premium glassmorphism design — ideal for your GitHub README")}
        {variant === "minimal"  && (lang === "tr" ? "Minimalist temiz tasarım — her yere uyan" : "Clean minimalist design — works everywhere")}
      </p>
    </motion.div>
  );
}
