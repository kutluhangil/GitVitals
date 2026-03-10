import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Github, Star, GitFork, Eye, AlertCircle, 
  Activity, Users, FileCode, Clock, ShieldCheck, Download, Mail,
  MapPin, Calendar, Info, BookOpen
} from "lucide-react";
import { RepoAnalysisData } from "@/hooks/use-analyze";
import { MetricCard } from "./MetricCard";
import { HealthMeter } from "./HealthMeter";
import { useSendEmailReport } from "@/hooks/use-email";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  data: any;
}

const CHART_COLORS = [
  "hsl(var(--primary))", 
  "hsl(var(--success))", 
  "hsl(280, 75%, 60%)", 
  "hsl(190, 90%, 50%)", 
  "hsl(330, 80%, 60%)"
];

export function Dashboard({ data }: DashboardProps) {
  const { toast } = useToast();
  const emailMutation = useSendEmailReport();
  const [email, setEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const isProfile = data?.type === 'profile';

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("report-dashboard");
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#0f0f0f",
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      const fileName = isProfile ? `${data.overview.username}-profile-gitvitals.pdf` : `${data.overview.owner}-${data.overview.name}-gitvitals.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export Successful",
        description: "Your PDF report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    const repoUrl = isProfile ? `https://github.com/${data.overview.username}` : `https://github.com/${data.overview.owner}/${data.overview.name}`;

    emailMutation.mutate(
      { email, repoUrl },
      {
        onSuccess: () => {
          toast({
            title: "Email Sent!",
            description: "The report has been sent to your inbox.",
          });
          setEmail("");
        },
        onError: (err) => {
          toast({
            title: "Failed to send",
            description: err.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isProfile) {
    return (
      <div className="w-full max-w-7xl mx-auto pb-24">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <img src={data.overview.avatarUrl} alt={data.overview.username} className="w-16 h-16 rounded-full border-2 border-primary/20 p-0.5" />
            <div>
              <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                {data.overview.name} <span className="text-muted-foreground font-light">(@{data.overview.username})</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">{data.overview.bio || "No bio available."}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-card border border-white/10 hover:border-white/20 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </motion.div>

        <div id="report-dashboard" className="space-y-6 bg-background rounded-3xl p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Repositories" 
              value={<CountUp end={data.overview.publicRepos} duration={2} />} 
              icon={<BookOpen className="w-5 h-5" />} 
              delay={0.1}
            />
            <MetricCard 
              title="Followers" 
              value={<CountUp end={data.overview.followers} duration={2} />} 
              icon={<Users className="w-5 h-5" />} 
              delay={0.2}
            />
            <MetricCard 
              title="Total Stars" 
              value={<CountUp end={data.stats.totalStars} duration={2} />} 
              icon={<Star className="w-5 h-5" />} 
              delay={0.3}
            />
            <MetricCard 
              title="Total Forks" 
              value={<CountUp end={data.stats.totalForks} duration={2} />} 
              icon={<GitFork className="w-5 h-5" />} 
              delay={0.4}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="glass-card rounded-3xl p-8 lg:col-span-1"
            >
              <h3 className="font-semibold font-display tracking-wide flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-primary" />
                Profile Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{data.overview.location || "Earth"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Joined {new Date(data.overview.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Following {data.overview.following}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="glass-card rounded-3xl p-8 lg:col-span-2"
            >
              <h3 className="font-semibold font-display tracking-wide flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-primary" />
                Top Repositories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.topRepos.map((repo: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-background border border-white/5 hover:border-primary/30 transition-all group">
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{repo.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8">{repo.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3" /> {repo.stars}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GitFork className="w-3 h-3" /> {repo.forks}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-card rounded-3xl p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20 lg:col-span-3"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold font-display tracking-wide flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Receive Full Profile Report
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get a detailed PDF analysis of this developer profile sent directly to your inbox.
                  </p>
                </div>
                <form onSubmit={handleEmailSend} className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    required
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={emailMutation.isPending}
                    className="px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
                  >
                    {emailMutation.isPending ? "Sending..." : "Send Report"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      {/* Actions Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
      >
        <div className="flex items-center gap-4">
          {data.overview?.avatarUrl ? (
            <img src={data.overview.avatarUrl} alt={data.overview.owner} className="w-12 h-12 rounded-xl border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
              <Github className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              {data.overview?.owner} <span className="text-muted-foreground font-light">/</span> {data.overview?.name}
            </h2>
            <p className="text-sm text-muted-foreground">{data.overview?.description || "No description provided."}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg bg-card border border-white/10 hover:border-white/20 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </motion.div>

      {/* Main Dashboard Container for PDF capture */}
      <div id="report-dashboard" className="space-y-6 bg-background rounded-3xl p-1">
        
        {/* Top Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Stars" 
            value={<CountUp end={data.popularity?.stars || 0} duration={2} separator="," />} 
            icon={<Star className="w-5 h-5" />} 
            delay={0.1}
          />
          <MetricCard 
            title="Forks" 
            value={<CountUp end={data.popularity?.forks || 0} duration={2} separator="," />} 
            icon={<GitFork className="w-5 h-5" />} 
            delay={0.2}
          />
          <MetricCard 
            title="Total Commits" 
            value={<CountUp end={data.metrics?.totalCommits || 0} duration={2} separator="," />} 
            icon={<Activity className="w-5 h-5" />} 
            delay={0.3}
          />
          <MetricCard 
            title="Contributors" 
            value={<CountUp end={data.contributors?.total || 0} duration={2.5} />} 
            icon={<Users className="w-5 h-5" />} 
            delay={0.4}
            subtitle={data.contributors?.busFactor ? `Bus Factor: ${data.contributors.busFactor}` : undefined}
          />
        </div>

        {/* Middle Complex Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Health Score Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="glass-card rounded-3xl p-8 lg:col-span-1 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-semibold font-display tracking-wide">Repository Health</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Overall metric based on activity, issues, and community.</p>
            <div className="flex-grow flex items-center justify-center">
              <HealthMeter score={data.health?.score || 0} status={data.health?.status || 'Inactive'} />
            </div>
          </motion.div>

          {/* Activity Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="glass-card rounded-3xl p-8 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold font-display tracking-wide flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Commit Activity
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Commit frequency over time</p>
              </div>
            </div>
            <div className="h-[250px] w-full">
              {data.activity?.commitsTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.activity.commitsTrend}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }} 
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Info className="w-8 h-8 opacity-20" />
                  <p>Activity data is being processed</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Languages Pie Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card rounded-3xl p-8"
          >
            <h3 className="font-semibold font-display tracking-wide flex items-center gap-2 mb-6">
              <FileCode className="w-5 h-5 text-primary" />
              Language Distribution
            </h3>
            <div className="h-[220px]">
              {data.languages ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.languages.map((l: any) => ({ name: l.name, value: l.percentage }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.languages.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Language data not available
                </div>
              )}
            </div>
          </motion.div>

          {/* Issue & Maintenance Health */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card rounded-3xl p-8"
          >
            <h3 className="font-semibold font-display tracking-wide flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-primary" />
              Issue & Maintenance
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Open Issues</span>
                  <span className="font-bold text-foreground">{data.popularity?.openIssues || 0}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-destructive h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Resolution Time (Avg)</span>
                  <span className="font-bold text-foreground">{data.health?.resolutionTimeHours || 0} hrs</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-success h-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> Created
                </div>
                <span className="text-sm font-medium">{data.overview?.createdAt ? new Date(data.overview.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </motion.div>

          {/* Email Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass-card rounded-3xl p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20"
          >
            <h3 className="font-semibold font-display tracking-wide flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              Receive Full Report
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get a detailed PDF analysis of this repository sent directly to your inbox.
            </p>
            
            <form onSubmit={handleEmailSend} className="space-y-4">
              <div>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={emailMutation.isPending}
                className="w-full px-4 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 flex justify-center items-center"
              >
                {emailMutation.isPending ? "Sending..." : "Send Report"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
