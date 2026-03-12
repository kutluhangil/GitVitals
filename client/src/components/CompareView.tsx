import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend
} from "recharts";
import { Star, GitFork, Users, Activity, ShieldCheck, AlertTriangle, Layers, Github, ExternalLink } from "lucide-react";

interface CompareViewProps {
  data: { repoA: any; repoB: any };
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3776ab",
  Go: "#00add8", Rust: "#ce412b", Java: "#b07219",
};

function getRiskColor(level: string) {
  if (level === 'High Risk') return "#ef4444";
  if (level === 'Medium Risk') return "#f59e0b";
  return "#10b981";
}

function StatRow({ label, a, b, higher = 'a' }: { label: string; a: number; b: number; higher?: 'a' | 'b' | 'none' }) {
  const winner = a > b ? 'a' : b > a ? 'b' : 'none';
  return (
    <div className="grid grid-cols-3 gap-3 items-center py-2.5 border-b border-white/5 last:border-0">
      <div className={`text-right text-sm font-semibold ${winner === 'a' ? 'text-success' : 'text-foreground'}`}>
        {typeof a === 'number' ? a.toLocaleString() : a}
        {winner === 'a' && <span className="ml-1 text-success text-xs">▲</span>}
      </div>
      <div className="text-center text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-left text-sm font-semibold ${winner === 'b' ? 'text-success' : 'text-foreground'}`}>
        {winner === 'b' && <span className="mr-1 text-success text-xs">▲</span>}
        {typeof b === 'number' ? b.toLocaleString() : b}
      </div>
    </div>
  );
}

export function CompareView({ data }: CompareViewProps) {
  const { repoA, repoB } = data;

  const radarData = [
    { metric: 'Health', A: repoA.health?.score || 0, B: repoB.health?.score || 0 },
    { metric: 'Stars', A: Math.min(100, (repoA.popularity?.stars || 0) / 100), B: Math.min(100, (repoB.popularity?.stars || 0) / 100) },
    { metric: 'Activity', A: repoA.activity?.commitsTrend?.reduce((s: number, w: any) => s + w.count, 0) || 0, B: repoB.activity?.commitsTrend?.reduce((s: number, w: any) => s + w.count, 0) || 0 },
    { metric: 'Contributors', A: Math.min(100, (repoA.contributors?.total || 0) * 5), B: Math.min(100, (repoB.contributors?.total || 0) * 5) },
    { metric: 'Safety', A: Math.max(0, 100 - (repoA.risk?.riskScore || 0)), B: Math.max(0, 100 - (repoB.risk?.riskScore || 0)) },
  ];

  const barData = [
    { name: 'Stars', A: repoA.popularity?.stars || 0, B: repoB.popularity?.stars || 0 },
    { name: 'Forks', A: repoA.popularity?.forks || 0, B: repoB.popularity?.forks || 0 },
    { name: 'Issues', A: repoA.popularity?.openIssues || 0, B: repoB.popularity?.openIssues || 0 },
    { name: 'Contributors', A: repoA.contributors?.total || 0, B: repoB.contributors?.total || 0 },
  ];

  const totalCommitsA = repoA.metrics?.totalCommits === '100+' ? 100 : (repoA.metrics?.totalCommits || 0);
  const totalCommitsB = repoB.metrics?.totalCommits === '100+' ? 100 : (repoB.metrics?.totalCommits || 0);

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-1">
          <Github className="w-6 h-6 text-primary" /> Repository Comparison
        </h2>
        <p className="text-muted-foreground text-sm">Side-by-side analysis of two GitHub repositories</p>
      </motion.div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[repoA, repoB].map((repo, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-2xl p-6 border-2 ${i === 0 ? 'border-primary/30' : 'border-purple-500/30'}`}>
              <div className="flex items-center gap-3 mb-3">
                {repo.overview?.avatarUrl && (
                  <img src={repo.overview.avatarUrl} alt={repo.overview.owner} className="w-9 h-9 rounded-lg border border-white/10" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-primary' : 'bg-purple-500'}`} />
                    <h3 className="font-bold text-foreground text-sm truncate">
                      {repo.overview?.owner}/{repo.overview?.name}
                    </h3>
                    {repo.overview?.htmlUrl && (
                      <a href={repo.overview.htmlUrl} target="_blank" rel="noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{repo.overview?.description || "No description"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />{(repo.popularity?.stars || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitFork className="w-3.5 h-3.5 text-primary" />{(repo.popularity?.forks || 0).toLocaleString()}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${getRiskColor(repo.risk?.riskLevel)}15`, color: getRiskColor(repo.risk?.riskLevel), border: `1px solid ${getRiskColor(repo.risk?.riskLevel)}30` }}>
                  {repo.risk?.riskLevel || 'Low Risk'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }} className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />Overview Comparison
            </h3>
            <div className="mb-3">
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-right text-xs font-bold text-primary">{repoA.overview?.name}</div>
                <div className="text-center text-xs text-muted-foreground uppercase tracking-wide">Metric</div>
                <div className="text-left text-xs font-bold text-purple-400">{repoB.overview?.name}</div>
              </div>
              <StatRow label="Stars" a={repoA.popularity?.stars || 0} b={repoB.popularity?.stars || 0} />
              <StatRow label="Forks" a={repoA.popularity?.forks || 0} b={repoB.popularity?.forks || 0} />
              <StatRow label="Watchers" a={repoA.popularity?.watchers || 0} b={repoB.popularity?.watchers || 0} />
              <StatRow label="Open Issues" a={repoA.popularity?.openIssues || 0} b={repoB.popularity?.openIssues || 0} higher="none" />
              <StatRow label="Contributors" a={repoA.contributors?.total || 0} b={repoB.contributors?.total || 0} />
              <StatRow label="Commits" a={totalCommitsA} b={totalCommitsB} />
              <StatRow label="Health Score" a={repoA.health?.score || 0} b={repoB.health?.score || 0} />
              <StatRow label="Risk Score" a={repoA.risk?.riskScore || 0} b={repoB.risk?.riskScore || 0} higher="none" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }} className="glass-card rounded-3xl p-8">
            <h3 className="font-semibold font-display mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />Radar Analysis
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Radar name={repoA.overview?.name || 'Repo A'} dataKey="A"
                    stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={repoB.overview?.name || 'Repo B'} dataKey="B"
                    stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeWidth={2} />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card rounded-3xl p-8">
          <h3 className="font-semibold font-display mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />Bar Comparison
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                <Bar name={repoA.overview?.name || 'Repo A'} dataKey="A" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar name={repoB.overview?.name || 'Repo B'} dataKey="B" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[repoA, repoB].map((repo, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }} className="glass-card rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-purple-500'}`} />
                <h3 className="font-semibold font-display">{repo.overview?.owner}/{repo.overview?.name} — Tech Stack</h3>
              </div>
              {repo.techStack && repo.techStack.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {repo.techStack.map((tech: string) => (
                    <span key={tech} className="px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-card border border-white/10 text-foreground">{tech}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No specific stack detected from topics.</p>
              )}
              {repo.languages?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {repo.languages.map((l: any, idx: number) => (
                    <div key={l.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: LANG_COLORS[l.name] || ['hsl(var(--primary))', '#a855f7', '#10b981', '#f59e0b', '#ef4444'][idx] }} />
                      {l.name} {l.percentage}%
                    </div>
                  ))}
                </div>
              )}
              {repo.risk?.warnings && repo.risk.warnings.length > 0 && (
                <div className="mt-4 space-y-1">
                  {repo.risk.warnings.map((w: string, wi: number) => (
                    <div key={wi} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />{w}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
