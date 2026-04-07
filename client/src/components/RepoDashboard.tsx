import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import {
  Github, Star, GitFork, Eye, AlertCircle,
  Activity, Users, FileCode, Clock, ShieldCheck, Download,
  AlertTriangle, CheckCircle, Layers, Tag, ExternalLink, Share2, Check
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { HealthMeter } from "./HealthMeter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface RepoDashboardProps {
  data: any;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(280, 75%, 60%)",
  "hsl(190, 90%, 50%)",
  "hsl(330, 80%, 60%)",
  "hsl(45, 90%, 55%)",
];

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3776ab",
  Go: "#00add8", Rust: "#ce412b", Java: "#b07219", "C#": "#178600",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF",
  Dart: "#00b4ab", CSS: "#563d7c", HTML: "#e34c26",
};

function getRiskColor(level: string) {
  if (level === 'High Risk') return "#ef4444";
  if (level === 'Medium Risk') return "#f59e0b";
  return "#10b981";
}

const TECH_BADGE_COLORS: Record<string, string> = {
  React: "#61dafb", "Next.js": "#ffffff", "Vue.js": "#41b883",
  Angular: "#dd0031", Svelte: "#ff3e00", TypeScript: "#3178c6",
  JavaScript: "#f7df1e", Python: "#3776ab", "Node.js": "#339933",
  Express: "#ffffff", "Tailwind CSS": "#38bdf8", Docker: "#2496ed",
  Kubernetes: "#326ce5", PostgreSQL: "#336791", MongoDB: "#47a248",
  Redis: "#dc382d", GraphQL: "#e10098", Rust: "#ce412b", Go: "#00add8",
};

export function RepoDashboard({ data }: RepoDashboardProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("repo-report");
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#0f0f0f" });
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
      pdf.save(`${data.overview.owner}-${data.overview.name}-gitvitals.pdf`);
      toast({ title: "Export Successful", description: "Your PDF report has been downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "There was an error generating the PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    const repoUrl = `https://github.com/${data.overview.owner}/${data.overview.name}`;
    const shareUrl = `${window.location.origin}?url=${encodeURIComponent(repoUrl)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link to show the repository analysis." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const riskColor = getRiskColor(data.risk?.riskLevel || 'Low Risk');
  const lastCommitDate = data.metrics?.lastCommitDate ? new Date(data.metrics.lastCommitDate).toLocaleDateString() : 'Unknown';

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          {data.overview?.avatarUrl ? (
            <img src={data.overview.avatarUrl} alt={data.overview.owner} className="w-12 h-12 rounded-xl border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
              <Github className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 flex-wrap">
              <span>{data.overview?.owner}</span>
              <span className="text-muted-foreground font-light">/</span>
              <span>{data.overview?.name}</span>
              {data.overview?.htmlUrl && (
                <a href={data.overview.htmlUrl} target="_blank" rel="noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">{data.overview?.description || "No description provided."}</p>
            {data.overview?.topics && data.overview.topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {data.overview.topics.slice(0, 5).map((t: string) => (
                  <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full border border-primary/20 font-mono">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={handleExportPDF} disabled={isExporting}
            className="px-4 py-2 rounded-lg bg-card border border-white/10 hover:border-white/20 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50">
            <Download className="w-4 h-4" />{isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </motion.div>

      <div id="repo-report" className="space-y-6 bg-background rounded-3xl p-1">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title="Stars" value={<CountUp end={data.popularity?.stars || 0} duration={2} separator="," />}
            icon={<Star className="w-5 h-5" />} delay={0.1} />
          <MetricCard title="Forks" value={<CountUp end={data.popularity?.forks || 0} duration={2} separator="," />}
            icon={<GitFork className="w-5 h-5" />} delay={0.2} />
          <MetricCard title="Total Commits" value={<span>{data.metrics?.totalCommits || 0}</span>}
            icon={<Activity className="w-5 h-5" />} delay={0.3} />
          <MetricCard title="Contributors" value={<CountUp end={data.contributors?.total || 0} duration={2} />}
            icon={<Users className="w-5 h-5" />} delay={0.4}
            subtitle={data.contributors?.busFactor ? `Bus Factor: ${data.contributors.busFactor}` : undefined} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-3xl p-8 lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-semibold font-display">Repository Health</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Activity, issues, community & documentation.</p>
            <div className="flex-grow flex items-center justify-center">
              <HealthMeter score={data.health?.score || 0} status={data.health?.status || 'Inactive'} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }} className="glass-card rounded-3xl p-8 lg:col-span-2">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary" />Commit Activity (Last 12 Weeks)
            </h3>
            <div className="h-[240px]">
              {data.activity?.commitsTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.activity.commitsTrend}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--primary))' }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No activity data available</div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
              <FileCode className="w-5 h-5 text-primary" />Language Distribution
            </h3>
            <div className="h-[200px]">
              {data.languages?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.languages.map((l: any) => ({ name: l.name, value: l.percentage }))}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {data.languages.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={LANG_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5" style={{ color: riskColor }} />
              Repo Risk Score
            </h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke={riskColor} strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 - ((data.risk?.riskScore || 0) / 100) * 2 * Math.PI * 48}
                    style={{ filter: `drop-shadow(0 0 6px ${riskColor}60)` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-display" style={{ color: riskColor }}>{data.risk?.riskScore || 0}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-semibold border"
                style={{ color: riskColor, borderColor: `${riskColor}40`, backgroundColor: `${riskColor}10` }}>
                {data.risk?.riskLevel || 'Low Risk'}
              </span>
              {data.risk?.warnings && data.risk.warnings.length > 0 && (
                <div className="w-full space-y-1.5 mt-1">
                  {data.risk.warnings.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              {(!data.risk?.warnings || data.risk.warnings.length === 0) && (
                <div className="flex items-center gap-2 text-xs text-success mt-1">
                  <CheckCircle className="w-4 h-4" /> No critical risk factors
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-5">
              <Layers className="w-5 h-5 text-primary" />Tech Stack
            </h3>
            {data.techStack && data.techStack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.techStack.map((tech: string) => {
                  const color = TECH_BADGE_COLORS[tech] || "#6366f1";
                  return (
                    <span key={tech} className="px-2.5 py-1 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
                      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {tech}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>No specific tech stack detected from repository topics.</p>
                <p className="mt-2">Languages detected:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.languages?.map((l: any) => (
                    <span key={l.name} className="px-2 py-0.5 rounded text-xs bg-card border border-white/10 text-foreground">{l.name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-white/5 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Last Commit</span>
                <span className="font-medium text-foreground">{lastCommitDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />License</span>
                <span className="font-medium text-foreground">{data.overview?.license || 'None'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Watchers</span>
                <span className="font-medium text-foreground">{data.popularity?.watchers || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {data.contributors?.top && data.contributors.top.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-primary" />Top Contributors
              <span className="ml-auto text-sm text-muted-foreground font-normal">Bus Factor: {data.contributors.busFactor}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {data.contributors.top.map((c: any, i: number) => {
                const totalContribs = data.contributors.top.reduce((s: number, x: any) => s + x.contributions, 0);
                const pct = totalContribs > 0 ? Math.round((c.contributions / totalContribs) * 100) : 0;
                return (
                  <a key={c.login} href={c.htmlUrl} target="_blank" rel="noreferrer"
                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="relative">
                      <img src={c.avatar_url} alt={c.login} className="w-10 h-10 rounded-full border border-white/10 group-hover:border-primary/30" />
                      {i === 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-[9px] flex items-center justify-center text-black font-bold">1</span>}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[80px]">{c.login}</p>
                      <p className="text-xs text-muted-foreground">{c.contributions} commits</p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{pct}%</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="glass-card rounded-3xl p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-semibold font-display flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5 text-primary" />Share This Analysis
              </h3>
              <p className="text-sm text-muted-foreground">Copy a link to share this repository analysis with your team or community.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button onClick={handleCopyLink}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-background hover:border-primary/30 text-sm font-medium transition-all">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a href={data.overview?.htmlUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
                <ExternalLink className="w-4 h-4" /> View on GitHub
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
