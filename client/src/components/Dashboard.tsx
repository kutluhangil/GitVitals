import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Github, Star, GitFork, Eye, AlertCircle, 
  Activity, Users, FileCode, Clock, ShieldCheck, Download, Mail
} from "lucide-react";
import { RepoAnalysisData } from "@/hooks/use-analyze";
import { MetricCard } from "./MetricCard";
import { HealthMeter } from "./HealthMeter";
import { useSendEmailReport } from "@/hooks/use-email";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  data: RepoAnalysisData;
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
      pdf.save(`${data.overview.owner}-${data.overview.name}-gitvitals.pdf`);
      
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
    
    emailMutation.mutate(
      { email, repoUrl: `https://github.com/${data.overview.owner}/${data.overview.name}` },
      {
        onSuccess: () => {
          toast({
            title: "Email Sent!",
            description: "The repository report has been sent to your inbox.",
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

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      {/* Actions Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
      >
        <div className="flex items-center gap-4">
          {data.overview.avatarUrl ? (
            <img src={data.overview.avatarUrl} alt={data.overview.owner} className="w-12 h-12 rounded-xl border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
              <Github className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              {data.overview.owner} <span className="text-muted-foreground font-light">/</span> {data.overview.name}
            </h2>
            <p className="text-sm text-muted-foreground">{data.overview.description || "No description provided."}</p>
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
            value={<CountUp end={data.popularity.stars} duration={2} separator="," />} 
            icon={<Star className="w-5 h-5" />} 
            delay={0.1}
          />
          <MetricCard 
            title="Forks" 
            value={<CountUp end={data.popularity.forks} duration={2} separator="," />} 
            icon={<GitFork className="w-5 h-5" />} 
            delay={0.2}
          />
          <MetricCard 
            title="Total Commits" 
            value={<CountUp end={data.activity.totalCommits} duration={2} separator="," />} 
            icon={<Activity className="w-5 h-5" />} 
            delay={0.3}
          />
          <MetricCard 
            title="Contributors" 
            value={<CountUp end={data.contributors.count} duration={2.5} />} 
            icon={<Users className="w-5 h-5" />} 
            delay={0.4}
            subtitle={`Bus Factor: ${data.contributors.busFactor}`}
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
              <HealthMeter score={data.health.score} status={data.health.status} />
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.languages}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.languages.map((entry, index) => (
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
                  <span className="font-bold text-foreground">{data.popularity.openIssues}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-destructive h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Resolution Time (Avg)</span>
                  <span className="font-bold text-foreground">{data.health.resolutionTimeHours} hrs</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-success h-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> Created
                </div>
                <span className="text-sm font-medium">{new Date(data.overview.createdAt).toLocaleDateString()}</span>
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
