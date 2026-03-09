import { motion } from "framer-motion";

export function HeartbeatAnimation() {
  return (
    <div className="relative w-full h-[300px] flex items-center justify-center overflow-hidden">
      {/* Glow effect behind the animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-primary/20 blur-[80px] rounded-full" />
      
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMid slice"
        className="opacity-80"
      >
        {/* The connecting graph/heartbeat line */}
        <motion.path
          d="M 0,100 L 150,100 L 200,40 L 250,160 L 300,100 L 400,100 L 450,70 L 500,130 L 550,100 L 800,100"
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1
          }}
        />

        {/* Git Nodes (Commits) */}
        {[
          { cx: 150, cy: 100, delay: 0.6 },
          { cx: 200, cy: 40, delay: 0.8 },
          { cx: 250, cy: 160, delay: 1.0 },
          { cx: 300, cy: 100, delay: 1.2 },
          { cx: 400, cy: 100, delay: 1.5 },
          { cx: 500, cy: 130, delay: 1.8 },
          { cx: 550, cy: 100, delay: 2.0 },
        ].map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r="6"
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: node.delay,
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: 3.5 // 3s path + 1s delay - node delay
            }}
          />
        ))}
        
        {/* Pulse blip traveling along the line */}
        <circle
          r="4"
          fill="#ffffff"
          style={{ filter: "drop-shadow(0 0 8px #ffffff)" }}
        >
          <animateMotion 
            path="M 0,100 L 150,100 L 200,40 L 250,160 L 300,100 L 400,100 L 450,70 L 500,130 L 550,100 L 800,100" 
            dur="4s" 
            repeatCount="indefinite" 
            calcMode="linear"
          />
        </circle>
      </svg>
    </div>
  );
}
