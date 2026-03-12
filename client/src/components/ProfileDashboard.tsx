import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip
} from "recharts";
import {
  Star, GitFork, BookOpen, Users, Download, Mail,
  MapPin, Calendar, Building2, Link, ExternalLink, Trophy
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { DeveloperCard } from "./DeveloperCard";
import { useSendEmailReport } from "@/hooks/use-email";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface ProfileDashboardProps {
  data: any;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3776ab",
  Go: "#00add8", Rust: "#ce412b", Java: "#b07219", "C#": "#178600",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF",
  Dart: "#00b4ab", CSS: "#563d7c", HTML: "#e34c26",
};
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(280,75%,60%)", "hsl(190,90%,50%)", "hsl(330,80%,60%)", "hsl(45,90%,55%)"];

function getScoreColor(score: number) {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#4f46e5";
  if (score >= 50) return "#f59e0b";
  if (score >= 25) return "#ef4444";
  return "#6b7280";
}

export function ProfileDashboard({ data }: ProfileDashboardProps) {
  const { toast } = useToast();
  const emailMutation = useSendEmailReport();
  const [email, setEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const score = data.developerScore?.score ?? 0;
  const level = data.developerScore?.level ?? "Developer";
  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;

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

  const handleEmailSend = (e: React.FormEvent) => {
    e.preventDefault();
    emailMutation.mutate(
      { email, repoUrl: `https://github.com/${data.overview.username}` },
      {
        onSuccess: () => { toast({ title: "Email Sent!" }); setEmail(""); },
        onError: (err) => toast({ title: "Failed to send", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <img src={data.overview.avatarUrl} alt={data.overview.username}
            className="w-16 h-16 rounded-full border-2 border-primary/20" />
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title="Repositories" value={<CountUp end={data.overview.publicRepos} duration={2} />}
            icon={<BookOpen className="w-5 h-5" />} delay={0.1} />
          <MetricCard title="Followers" value={<CountUp end={data.overview.followers} duration={2} separator="," />}
            icon={<Users className="w-5 h-5" />} delay={0.2} />
          <MetricCard title="Total Stars" value={<CountUp end={data.portfolio?.totalStars || 0} duration={2} separator="," />}
            icon={<Star className="w-5 h-5" />} delay={0.3} />
          <MetricCard title="Total Forks" value={<CountUp end={data.portfolio?.totalForks || 0} duration={2} separator="," />}
            icon={<GitFork className="w-5 h-5" />} delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }} className="glass-card rounded-3xl p-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 self-start">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="font-semibold font-display">Developer Score</h3>
            </div>
            <div className="relative w-44 h-44 my-2">
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
                  transition={{ delay: 1.2 }} className="text-5xl font-bold font-display" style={{ color: scoreColor }}>
                  {score}
                </motion.span>
                <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
              </div>
            </div>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border mt-3"
              style={{ color: scoreColor, borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}10` }}>
              {level}
            </motion.span>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }} className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-primary" />Profile Info
            </h3>
            <div className="space-y-3">
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
                  <a href={data.overview.blog.startsWith('http') ? data.overview.blog : `https://${data.overview.blog}`}
                    target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    {data.overview.blog}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Joined {new Date(data.overview.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Following {data.overview.following} developers</span>
              </div>
            </div>
            {data.portfolio && (
              <div className="mt-5 pt-5 border-t border-white/5 space-y-2">
                {data.portfolio.mostStarred && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Most Starred</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />{data.portfolio.mostStarred.name}
                    </span>
                  </div>
                )}
                {data.portfolio.mostForked && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Most Forked</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <GitFork className="w-3 h-3 text-primary" />{data.portfolio.mostForked.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Stars / Repo</span>
                  <span className="font-medium text-foreground">{data.portfolio.avgStars}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Repos</span>
                  <span className="font-medium text-foreground">{data.portfolio.originalRepos}</span>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }} className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />Language Expertise
            </h3>
            <div className="h-[220px]">
              {data.languageExpertise?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.languageExpertise.map((l: any) => ({ name: l.name, value: l.percentage }))}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {data.languageExpertise.map((entry: any, index: number) => (
                        <Cell key={index} fill={LANG_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} formatter={(v: any) => [`${v}%`]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
                      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No language data</div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="glass-card rounded-3xl p-8">
          <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-primary" />Top Repositories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topRepos?.map((repo: any, i: number) => (
              <a key={i} href={repo.url} target="_blank" rel="noreferrer"
                className="p-4 rounded-xl bg-background border border-white/5 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate flex-1">{repo.name}</h4>
                  {repo.language && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 ml-2"
                      style={{ backgroundColor: `${LANG_COLORS[repo.language] || '#6366f1'}20`, color: LANG_COLORS[repo.language] || '#6366f1' }}>
                      {repo.language}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 h-8">{repo.description || "No description"}</p>
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

        <DeveloperCard data={data} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
          className="glass-card rounded-3xl p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-semibold font-display flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />Receive Full Profile Report
              </h3>
              <p className="text-sm text-muted-foreground">Get a detailed PDF analysis sent to your inbox.</p>
            </div>
            <form onSubmit={handleEmailSend} className="flex-1 w-full flex flex-col sm:flex-row gap-3">
              <input type="email" required placeholder="name@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
              <button type="submit" disabled={emailMutation.isPending}
                className="px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                {emailMutation.isPending ? "Sending..." : "Send Report"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
