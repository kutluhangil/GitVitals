import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  Star, GitFork, BookOpen, Users, Download,
  MapPin, Calendar, Building2, Link, ExternalLink, Trophy,
  Share2, Check, Lightbulb, Award, Code2
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { DeveloperCard } from "./DeveloperCard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";

const T = {
  en: {
    repositories: "Repositories", followers: "Followers", totalStars: "Total Stars", totalForks: "Total Forks",
    developerScore: "Developer Score", profileInfo: "Profile Info", languageExpertise: "Language Expertise",
    topRepositories: "Top Repositories", howToImprove: "How to Improve Your Score",
    memberSince: "Joined", following: "Following", followingLabel: "developers",
    mostStarred: "Most Starred", mostForked: "Most Forked", avgStars: "Avg Stars / Repo", originalRepos: "Original Repos",
    shareAnalysis: "Share This Analysis", shareDesc: "Copy a link to share this developer profile analysis with anyone.",
    copyLink: "Copy Link", copied: "Copied!", viewOnGithub: "View on GitHub",
    exportPdf: "Export PDF", exporting: "Exporting...",
    exportSuccess: "Export Successful", exportSuccessDesc: "Your PDF report has been downloaded.",
    exportFail: "Export Failed", exportFailDesc: "There was an error generating the PDF.",
    linkCopied: "Link copied!", linkCopiedDesc: "Share this link to show the analysis.",
    noLanguageData: "No language data", noBio: "No bio available.", noDesc: "No description",
    score: "/ 100",
    tips: [
      { icon: "⭐", tip: "Build projects that solve real problems to earn more stars." },
      { icon: "👥", tip: "Follow developers, engage with issues & PRs to grow your network." },
      { icon: "✏️", tip: "Add a bio to your GitHub profile — it improves discoverability." },
      { icon: "🌐", tip: "Add a personal website or portfolio link to your profile." },
      { icon: "🔨", tip: "Focus on building original projects rather than forking." },
      { icon: "📦", tip: "Create more public repositories to showcase your skill breadth." },
      { icon: "🚀", tip: "Share your projects on Twitter / LinkedIn to attract attention." },
    ],
    breakdown: ["Stars","Community","Repositories","Followers","Originality","Account Age","Star Bonus"],
    breakdownHints: [
      (s:number,n:number)=>`${n} total stars across all repos`,
      (s:number)=>`Based on forks & star thresholds`,
      (s:number,n:number)=>`${n} public repos (target: 50)`,
      (s:number,n:number)=>`${n} followers (target: 200)`,
      (s:number,n:number)=>`${n} original repos (target: 30)`,
      (s:number,n:number)=>`${n.toFixed(1)} years (target: 5)`,
      ()=>`Bonus for >100 or >1000 total stars`,
    ],
  },
  tr: {
    repositories: "Repolar", followers: "Takipçi", totalStars: "Toplam Yıldız", totalForks: "Toplam Fork",
    developerScore: "Geliştirici Skoru", profileInfo: "Profil Bilgisi", languageExpertise: "Dil Uzmanlığı",
    topRepositories: "En İyi Repolar", howToImprove: "Skorunu Nasıl Artırırsın?",
    memberSince: "Katılım", following: "Takip Edilen", followingLabel: "geliştirici",
    mostStarred: "En Çok Yıldız", mostForked: "En Çok Fork", avgStars: "Ort. Yıldız / Repo", originalRepos: "Orijinal Repo",
    shareAnalysis: "Bu Analizi Paylaş", shareDesc: "Bu geliştirici profil analizini herkesle paylaşmak için linki kopyala.",
    copyLink: "Linki Kopyala", copied: "Kopyalandı!", viewOnGithub: "GitHub'da Gör",
    exportPdf: "PDF İndir", exporting: "İndiriliyor...",
    exportSuccess: "İndirme Başarılı", exportSuccessDesc: "PDF raporunuz indirildi.",
    exportFail: "İndirme Başarısız", exportFailDesc: "PDF oluşturulurken hata oluştu.",
    linkCopied: "Link kopyalandı!", linkCopiedDesc: "Analizi göstermek için bu linki paylaş.",
    noLanguageData: "Dil verisi yok", noBio: "Bio eklenmemiş.", noDesc: "Açıklama yok",
    score: "/ 100",
    tips: [
      { icon: "⭐", tip: "Gerçek problemleri çözen projeler yap, yıldız sayını artır." },
      { icon: "👥", tip: "Geliştiricileri takip et, issue ve PR'lara katıl, ağını büyüt." },
      { icon: "✏️", tip: "GitHub profiline bir bio ekle — bulunma olasılığını artırır." },
      { icon: "🌐", tip: "Profiline kişisel web site veya portfolyo linki ekle." },
      { icon: "🔨", tip: "Fork yerine kendi özgün projelerini geliştirmeye odaklan." },
      { icon: "📦", tip: "Beceri çeşitliliğini göstermek için daha fazla public repo oluştur." },
      { icon: "🚀", tip: "Projelerini Twitter / LinkedIn'de paylaş, ilgi çek." },
    ],
    breakdown: ["Yıldız","Topluluk","Repolar","Takipçi","Özgünlük","Hesap Yaşı","Yıldız Bonusu"],
    breakdownHints: [
      (s:number,n:number)=>`Tüm repolarda ${n} yıldız`,
      ()=>`Fork ve yıldız eşiklerine göre`,
      (s:number,n:number)=>`${n} public repo (hedef: 50)`,
      (s:number,n:number)=>`${n} takipçi (hedef: 200)`,
      (s:number,n:number)=>`${n} özgün repo (hedef: 30)`,
      (s:number,n:number)=>`${n.toFixed(1)} yıl (hedef: 5)`,
      ()=>`>100 veya >1000 yıldız bonusu`,
    ],
  },
};

interface ProfileDashboardProps {
  data: any;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3776ab",
  Go: "#00add8", Rust: "#ce412b", Java: "#b07219", "C#": "#178600",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF",
  Dart: "#00b4ab", CSS: "#563d7c", HTML: "#e34c26",
};
const FALLBACK_COLORS = ["#6366f1","#10b981","#f59e0b","#ec4899","#8b5cf6","#06b6d4"];

function getScoreColor(score: number) {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#4f46e5";
  if (score >= 50) return "#f59e0b";
  if (score >= 25) return "#ef4444";
  return "#6b7280";
}

function getMemberYears(createdAt: string): string {
  const years = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years < 1) return "< 1 year on GitHub";
  return `${Math.floor(years)}+ year${Math.floor(years) > 1 ? "s" : ""} on GitHub`;
}

function getScoreBreakdown(data: any) {
  const repoCount   = data.overview?.publicRepos || 0;
  const totalStars  = data.portfolio?.totalStars  || 0;
  const totalForks  = data.portfolio?.totalForks  || 0;
  const followers   = data.overview?.followers    || 0;
  const years       = (Date.now() - new Date(data.overview?.createdAt || 0).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const origRepos   = data.portfolio?.originalRepos || 0;

  const starsScore    = Math.min(25, (totalStars  / 500) * 25);
  const followScore   = Math.min(15, (followers   / 200) * 15);
  const reposScore    = Math.min(15, (repoCount   / 50)  * 15);
  const ageScore      = Math.min(10, (years       / 5)   * 10);
  const origScore     = Math.min(10, (origRepos   / 30)  * 10);
  const communityScore =
    (totalStars > 1000 || totalForks > 50) ? 15 :
    (totalForks > 0 || totalStars > 0)     ? 7  : 0;
  const bonusScore    = totalStars > 1000 ? 10 : totalStars > 100 ? 5 : 0;

  return [
    { label: "Stars",        score: Math.round(starsScore),     max: 25, color: "#f59e0b",  hint: `${totalStars} total stars across all repos` },
    { label: "Community",    score: Math.round(communityScore), max: 15, color: "#6366f1",  hint: `Based on forks & star thresholds` },
    { label: "Repositories", score: Math.round(reposScore),     max: 15, color: "#10b981",  hint: `${repoCount} public repos (target: 50)` },
    { label: "Followers",    score: Math.round(followScore),    max: 15, color: "#3b82f6",  hint: `${followers} followers (target: 200)` },
    { label: "Originality",  score: Math.round(origScore),      max: 10, color: "#ec4899",  hint: `${origRepos} original repos (target: 30)` },
    { label: "Account Age",  score: Math.round(ageScore),       max: 10, color: "#8b5cf6",  hint: `${years.toFixed(1)} years (target: 5)` },
    { label: "Star Bonus",   score: Math.round(bonusScore),     max: 10, color: "#06b6d4",  hint: `Bonus for >100 or >1000 total stars` },
  ];
}

function getImprovementTips(data: any): { icon: string; tip: string }[] {
  const tips: { icon: string; tip: string }[] = [];
  const totalStars  = data.portfolio?.totalStars  || 0;
  const followers   = data.overview?.followers    || 0;
  const repoCount   = data.overview?.publicRepos  || 0;
  const origRepos   = data.portfolio?.originalRepos || 0;

  if (totalStars < 50)
    tips.push({ icon: "⭐", tip: "Build projects that solve real problems to earn more stars." });
  if (followers < 30)
    tips.push({ icon: "👥", tip: "Follow developers, engage with issues & PRs to grow your network." });
  if (!data.overview?.bio)
    tips.push({ icon: "✏️", tip: "Add a bio to your GitHub profile — it improves discoverability." });
  if (!data.overview?.blog)
    tips.push({ icon: "🌐", tip: "Add a personal website or portfolio link to your profile." });
  if (repoCount > 0 && origRepos / repoCount < 0.7)
    tips.push({ icon: "🔨", tip: "Focus on building original projects rather than forking." });
  if (repoCount < 15)
    tips.push({ icon: "📦", tip: "Create more public repositories to showcase your skill breadth." });
  if (totalStars < 10)
    tips.push({ icon: "🚀", tip: "Share your projects on Twitter / LinkedIn to attract attention." });

  return tips.slice(0, 4);
}

export function ProfileDashboard({ data }: ProfileDashboardProps) {
  const { toast } = useToast();
  const { lang } = useApp();
  const t = T[lang];
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const score       = data.developerScore?.score ?? 0;
  const level       = data.developerScore?.level ?? "Developer";
  const scoreColor  = getScoreColor(score);
  const circumference = 2 * Math.PI * 60;
  const offset      = circumference - (score / 100) * circumference;
  const memberYears = data.overview?.createdAt ? getMemberYears(data.overview.createdAt) : "";

  // Compute breakdown labels + hints from t
  const breakdown = (() => {
    const repoCount  = data.overview?.publicRepos || 0;
    const totalStars = data.portfolio?.totalStars  || 0;
    const totalForks = data.portfolio?.totalForks  || 0;
    const followers  = data.overview?.followers    || 0;
    const years      = (Date.now() - new Date(data.overview?.createdAt || 0).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const origRepos  = data.portfolio?.originalRepos || 0;
    const starsScore    = Math.min(25, (totalStars  / 500) * 25);
    const followScore   = Math.min(15, (followers   / 200) * 15);
    const reposScore    = Math.min(15, (repoCount   / 50)  * 15);
    const ageScore      = Math.min(10, (years       / 5)   * 10);
    const origScore     = Math.min(10, (origRepos   / 30)  * 10);
    const communityScore = (totalStars > 1000 || totalForks > 50) ? 15 : (totalForks > 0 || totalStars > 0) ? 7 : 0;
    const bonusScore    = totalStars > 1000 ? 10 : totalStars > 100 ? 5 : 0;
    const scores = [starsScore, communityScore, reposScore, followScore, origScore, ageScore, bonusScore];
    const maxes  = [25, 15, 15, 15, 10, 10, 10];
    const colors = ["#f59e0b","#6366f1","#10b981","#3b82f6","#ec4899","#8b5cf6","#06b6d4"];
    const hintArgs = [totalStars, 0, repoCount, followers, origRepos, years, 0];
    return t.breakdown.map((label, i) => ({
      label, color: colors[i], score: Math.round(scores[i]), max: maxes[i],
    }));
  })();

  const tips = (() => {
    const totalStars = data.portfolio?.totalStars || 0;
    const followers  = data.overview?.followers   || 0;
    const repoCount  = data.overview?.publicRepos || 0;
    const origRepos  = data.portfolio?.originalRepos || 0;
    return t.tips.filter((tip, i) => {
      if (i === 0) return totalStars < 50;
      if (i === 1) return followers < 30;
      if (i === 2) return !data.overview?.bio;
      if (i === 3) return !data.overview?.blog;
      if (i === 4) return repoCount > 0 && origRepos / repoCount < 0.7;
      if (i === 5) return repoCount < 15;
      if (i === 6) return totalStars < 10;
      return false;
    }).slice(0, 4);
  })();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("profile-report");
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#0f0f0f" });
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
      pdf.save(`${data.overview.username}-profile-gitvitals.pdf`);
      toast({ title: "Export Successful", description: "Your PDF report has been downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "There was an error generating the PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?url=${encodeURIComponent(data.overview.htmlUrl)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link to show the analysis." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <img src={data.overview.avatarUrl} alt={data.overview.username}
            className="w-16 h-16 rounded-full border-2 border-primary/20" />
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 flex-wrap">
              {data.overview.name}
              <span className="text-muted-foreground font-light text-lg">@{data.overview.username}</span>
              <a href={data.overview.htmlUrl} target="_blank" rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg">{data.overview.bio || "No bio available."}</p>
          </div>
        </div>
        <button onClick={handleExportPDF} disabled={isExporting}
          className="px-4 py-2 rounded-lg bg-card border border-white/10 hover:border-white/20 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 flex-shrink-0">
          <Download className="w-4 h-4" />{isExporting ? "Exporting..." : "Export PDF"}
        </button>
      </motion.div>

      <div id="profile-report" className="space-y-6 bg-background rounded-3xl p-1">

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title={t.repositories} value={<CountUp end={data.overview.publicRepos} duration={2} />}
            icon={<BookOpen className="w-5 h-5" />} delay={0.1} />
          <MetricCard title={t.followers} value={<CountUp end={data.overview.followers} duration={2} separator="," />}
            icon={<Users className="w-5 h-5" />} delay={0.2} />
          <MetricCard title={t.totalStars} value={<CountUp end={data.portfolio?.totalStars || 0} duration={2} separator="," />}
            icon={<Star className="w-5 h-5" />} delay={0.3} />
          <MetricCard title={t.totalForks} value={<CountUp end={data.portfolio?.totalForks || 0} duration={2} separator="," />}
            icon={<GitFork className="w-5 h-5" />} delay={0.4} />
        </div>

        {/* Score + Profile Info + Languages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Developer Score + Breakdown */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }} className="glass-card rounded-3xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="font-semibold font-display">{t.developerScore}</h3>
            </div>

            {/* Circle */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  <motion.circle cx="80" cy="80" r="60" fill="none" stroke={scoreColor} strokeWidth="12"
                    strokeLinecap="round" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.8, ease: "easeOut", delay: 0.8 }}
                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor}60)` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }} className="text-4xl font-bold font-display" style={{ color: scoreColor }}>
                    {score}
                  </motion.span>
                  <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
                </div>
              </div>
            </div>

            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border self-center mb-5"
              style={{ color: scoreColor, borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}10` }}>
              {level}
            </motion.span>

            {/* Breakdown Bars */}
            <div className="space-y-2.5">
              {breakdown.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-medium" style={{ color: item.color }}>
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / item.max) * 100}%` }}
                      transition={{ delay: 1.0 + i * 0.08, duration: 0.6, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Profile Info */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }} className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-primary" />{t.profileInfo}
            </h3>
            <div className="space-y-3">
              {/* GitHub Member Badge */}
              {memberYears && (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary">
                    <Award className="w-3.5 h-3.5" /> {memberYears}
                  </span>
                </div>
              )}
              {data.overview.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{data.overview.location}</span>
                </div>
              )}
              {data.overview.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{data.overview.company}</span>
                </div>
              )}
              {data.overview.blog && (
                <div className="flex items-center gap-3 text-sm">
                  <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={data.overview.blog.startsWith("http") ? data.overview.blog : `https://${data.overview.blog}`}
                    target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    {data.overview.blog}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">
                  {t.memberSince} {new Date(data.overview.createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{t.following} {data.overview.following} {t.followingLabel}</span>
              </div>
            </div>
            {data.portfolio && (
              <div className="mt-5 pt-5 border-t border-white/5 space-y-2">
                {data.portfolio.mostStarred && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.mostStarred}</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />{data.portfolio.mostStarred.name}
                    </span>
                  </div>
                )}
                {data.portfolio.mostForked && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.mostForked}</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <GitFork className="w-3 h-3 text-primary" />{data.portfolio.mostForked.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t.avgStars}</span>
                  <span className="font-medium text-foreground">{data.portfolio.avgStars}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t.originalRepos}</span>
                  <span className="font-medium text-foreground">{data.portfolio.originalRepos}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Language Expertise — Bar Chart */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }} className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
              <Code2 className="w-5 h-5 text-primary" />{t.languageExpertise}
            </h3>
            {data.languageExpertise?.length ? (
              <div className="space-y-4">
                {data.languageExpertise.map((lang: any, i: number) => {
                  const color = LANG_COLORS[lang.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  return (
                    <div key={lang.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium" style={{ color }}>{lang.name}</span>
                        <span className="text-xs font-semibold text-muted-foreground">{lang.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${lang.percentage}%` }}
                          transition={{ delay: 0.8 + i * 0.1, duration: 0.7, ease: "easeOut" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{t.noLanguageData}</div>
            )}
          </motion.div>
        </div>

        {/* Top Repositories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="glass-card rounded-3xl p-8">
          <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-primary" />{t.topRepositories}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topRepos?.map((repo: any, i: number) => (
              <a key={i} href={repo.url} target="_blank" rel="noreferrer"
                className="p-4 rounded-xl bg-background border border-white/5 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate flex-1">{repo.name}</h4>
                  {repo.language && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 ml-2"
                      style={{ backgroundColor: `${LANG_COLORS[repo.language] || "#6366f1"}20`, color: LANG_COLORS[repo.language] || "#6366f1" }}>
                      {repo.language}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 h-8">{repo.description || t.noDesc}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3" />{repo.stars.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitFork className="w-3 h-3" />{repo.forks.toLocaleString()}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* What to Improve */}
        {tips.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-yellow-400" />{t.howToImprove}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tips.map((t, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-background border border-white/5 hover:border-yellow-400/20 transition-all">
                  <span className="text-xl flex-shrink-0">{t.icon}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <DeveloperCard data={data} />

        {/* Share */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="glass-card rounded-3xl p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-semibold font-display flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5 text-primary" />{t.shareAnalysis}
              </h3>
              <p className="text-sm text-muted-foreground">{t.shareDesc}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button onClick={handleCopyLink}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-background hover:border-primary/30 text-sm font-medium transition-all">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? t.copied : t.copyLink}
              </button>
              <a href={data.overview.htmlUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
                <ExternalLink className="w-4 h-4" /> {t.viewOnGithub}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
