import { motion } from "framer-motion";
import { Github, Heart } from "lucide-react";

const letters = "Built by kutluhangil".split("");

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col items-center gap-3">

        {/* Animated Letter-by-Letter Text */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <motion.div
            className="flex items-center gap-0.5"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {letters.map((char, i) => (
              <motion.span
                key={i}
                className={`text-sm font-medium ${
                  char === " " ? "mr-1" : ""
                } ${
                  i >= 9 /* "kutluhangil" starts at index 9 */
                    ? "bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent font-bold"
                    : "text-muted-foreground"
                }`}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.div>

          {/* Pulsing heart */}
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
          >
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </motion.span>
        </div>

        {/* Subtle bottom row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center gap-3 text-xs text-muted-foreground/60"
        >
          <a
            href="https://github.com/kutluhangil/Repository-Insights"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="w-3 h-3" /> View Source
          </a>
          <span>·</span>
          <span>Powered by GitHub API</span>
          <span>·</span>
          <span>GitVitals © {new Date().getFullYear()}</span>
        </motion.div>

      </div>
    </footer>
  );
}
