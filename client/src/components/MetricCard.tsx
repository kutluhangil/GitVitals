import { ReactNode } from "react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  delay?: number;
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, delay = 0, className = "" }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-white/10 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</h3>
        {icon && <div className="text-muted-foreground/50 group-hover:text-primary transition-colors">{icon}</div>}
      </div>
      <div>
        <div className="text-3xl font-bold text-foreground font-display tracking-tight">{value}</div>
        {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
