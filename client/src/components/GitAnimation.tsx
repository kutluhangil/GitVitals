import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";

const DARK_LINE = "rgba(255,255,255,0.12)";
const LIGHT_LINE = "rgba(0,0,0,0.1)";
const DARK_NODE_FILL = "#0f0f0f";
const LIGHT_NODE_FILL = "#ffffff";
const DARK_NODE_STROKE = "rgba(255,255,255,0.35)";
const LIGHT_NODE_STROKE = "rgba(0,0,0,0.25)";
const PULSE_COLOR = "hsl(243, 75%, 65%)";

const MAIN_PATH = "M 40,100 L 760,100";
const BRANCH_UP_PATH = "M 220,100 L 280,55 L 420,55 L 480,100";
const BRANCH_DOWN_PATH = "M 340,100 L 400,145 L 540,145 L 600,100";

const MAIN_NODES = [
  { cx: 40, cy: 100 },
  { cx: 160, cy: 100 },
  { cx: 220, cy: 100 },
  { cx: 340, cy: 100 },
  { cx: 480, cy: 100 },
  { cx: 600, cy: 100 },
  { cx: 720, cy: 100 },
  { cx: 760, cy: 100 },
];

const BRANCH_UP_NODES = [
  { cx: 280, cy: 55 },
  { cx: 350, cy: 55 },
  { cx: 420, cy: 55 },
];

const BRANCH_DOWN_NODES = [
  { cx: 400, cy: 145 },
  { cx: 470, cy: 145 },
  { cx: 540, cy: 145 },
];

const PULSE_ANIM_PATH = MAIN_PATH;

interface NodeProps {
  cx: number; cy: number; delay: number;
  fill: string; stroke: string;
  isPrimary?: boolean;
}

function Node({ cx, cy, delay, fill, stroke, isPrimary }: NodeProps) {
  return (
    <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}>
      {isPrimary && (
        <motion.circle cx={cx} cy={cy} r={10} fill="none" stroke={PULSE_COLOR} strokeWidth={1}
          animate={{ r: [8, 16], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeOut" }} />
      )}
      <circle cx={cx} cy={cy} r={isPrimary ? 5 : 4} fill={fill} stroke={stroke} strokeWidth={isPrimary ? 2 : 1.5} />
    </motion.g>
  );
}

export function GitAnimation() {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const lineColor = isDark ? DARK_LINE : LIGHT_LINE;
  const nodeFill = isDark ? DARK_NODE_FILL : LIGHT_NODE_FILL;
  const nodeStroke = isDark ? DARK_NODE_STROKE : LIGHT_NODE_STROKE;

  return (
    <div className="relative w-full max-w-3xl mx-auto h-[200px] select-none pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0 rounded-2xl opacity-60"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 60% 80% at 50% 50%, hsl(243 75% 59% / 0.06) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 80% at 50% 50%, hsl(243 75% 59% / 0.04) 0%, transparent 70%)",
        }}
      />
      <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <motion.path d={BRANCH_UP_PATH} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.8, ease: "easeInOut" }} />
        <motion.path d={BRANCH_DOWN_PATH} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 1.0, ease: "easeInOut" }} />
        <motion.path d={MAIN_PATH} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.2, ease: "easeInOut" }} />

        {MAIN_NODES.map((n, i) => (
          <Node key={`m-${i}`} {...n} delay={0.4 + i * 0.15} fill={nodeFill} stroke={nodeStroke}
            isPrimary={i === 4} />
        ))}
        {BRANCH_UP_NODES.map((n, i) => (
          <Node key={`u-${i}`} {...n} delay={1.2 + i * 0.12} fill={nodeFill} stroke={nodeStroke} />
        ))}
        {BRANCH_DOWN_NODES.map((n, i) => (
          <Node key={`d-${i}`} {...n} delay={1.4 + i * 0.12} fill={nodeFill} stroke={nodeStroke} />
        ))}

        <motion.circle r={3.5} fill={PULSE_COLOR}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.5, delay: 2.5, repeat: Infinity, repeatDelay: 2, times: [0, 0.1, 0.9, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${PULSE_COLOR})` }}>
          <animateMotion path={PULSE_ANIM_PATH} dur="3.5s" begin="2.5s" repeatCount="indefinite"
            calcMode="linear" keyPoints="0;1" keyTimes="0;1" />
        </motion.circle>
      </svg>
    </div>
  );
}
