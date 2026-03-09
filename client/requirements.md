## Packages
framer-motion | Smooth animations for the heartbeat graph, loading states, and dashboard reveals
recharts | Beautiful, declarative charts for language distribution and activity metrics
react-countup | Animated number counters for metrics
html2canvas | Required for PDF export functionality (capturing the dashboard)
jspdf | Required for PDF export functionality (generating the document)

## Notes
- Tailwind Config - extend fontFamily:
  fontFamily: {
    display: ["Outfit", "sans-serif"],
    body: ["Inter", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"]
  }
- The app enforces a dark theme (Minimalist Developer tool aesthetic)
- Assumes the GET /api/analyze endpoint returns a structured JSON matching the dashboard's expected data shape.
