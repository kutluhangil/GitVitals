import { motion } from "framer-motion";

interface HealthMeterProps {
  score: number;
  status: string;
}

export function HealthMeter({ score, status }: HealthMeterProps) {
  // Determine color based on score
  const getColor = (s: number) => {
    if (s >= 80) return "hsl(var(--success))";
    if (s >= 60) return "hsl(45, 100%, 50%)"; // yellow
    if (s >= 40) return "hsl(25, 100%, 50%)"; // orange
    return "hsl(var(--destructive))";
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className="relative w-48 h-48">
        {/* Background track */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="transparent"
            stroke="hsl(var(--border))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Animated progress track */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="transparent"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        
        {/* Score text inside circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-5xl font-bold font-display tracking-tighter"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium uppercase mt-1">/ 100</span>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-6 text-center"
      >
        <span 
          className="px-4 py-1.5 rounded-full text-sm font-semibold border"
          style={{ 
            color, 
            borderColor: `${color}40`,
            backgroundColor: `${color}10` 
          }}
        >
          {status} Status
        </span>
      </motion.div>
    </div>
  );
}
