<div align="center">

<br />

<img src="https://img.shields.io/badge/GitVitals-v1.0-6366f1?style=for-the-badge&logoColor=white" alt="version" />
<img src="https://img.shields.io/badge/Built_with-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
<img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="react" />
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="vercel" />

<br /><br />

```
  ██████╗ ██╗████████╗██╗   ██╗██╗████████╗ █████╗ ██╗     ███████╗
 ██╔════╝ ██║╚══██╔══╝██║   ██║██║╚══██╔══╝██╔══██╗██║     ██╔════╝
 ██║  ███╗██║   ██║   ██║   ██║██║   ██║   ███████║██║     ███████╗
 ██║   ██║██║   ██║   ╚██╗ ██╔╝██║   ██║   ██╔══██║██║     ╚════██║
 ╚██████╔╝██║   ██║    ╚████╔╝ ██║   ██║   ██║  ██║███████╗███████║
  ╚═════╝ ╚═╝   ╚═╝     ╚═══╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝
```

### **The health check for GitHub** — Analyze repositories & developers in seconds.

[Live Demo](https://gitvitals.vercel.app) · [Report Bug](https://github.com/kutluhangil/Repository-Insights/issues) · [Request Feature](https://github.com/kutluhangil/Repository-Insights/issues)

</div>

---

## ✦ What is GitVitals?

**GitVitals** is a GitHub intelligence tool that gives you a complete picture of any public GitHub repository or developer profile — instantly. Paste a URL, get deep insights.

No sign-up. No API keys required. Just paste and analyze.

---

## ⚡ Features

| Feature | Description |
|--------|-------------|
| 🔍 **Repo Analyzer** | Health score, commit trends, language breakdown, risk assessment |
| 👤 **Developer Insights** | Developer score, language expertise, portfolio stats, shareable card |
| ⚔️ **Side-by-Side Compare** | Compare two repositories across 10+ metrics simultaneously |
| 🕓 **Analysis History** | Recent analyses saved locally — revisit with one click |
| 📄 **PDF Export** | Download a full report as a PDF in one click |
| 🔗 **Shareable Links** | Copy a direct link to any analysis |
| 🌐 **EN / TR** | Full English and Turkish language support |
| 🌙 **Dark / Light Mode** | System-aware theme toggle |

---

## 🖼️ Screenshots

> *(Add screenshots here after deployment)*

---

## 🛠️ Tech Stack

```
Frontend          →  React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion
Charts            →  Recharts
Data              →  GitHub REST API v3 (public, no auth required)
Backend           →  Express.js · Node.js
PDF Export        →  html2canvas + jsPDF
Deployment        →  Vercel
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/kutluhangil/Repository-Insights.git
cd Repository-Insights

# Install dependencies
npm install

# Start the dev server (runs on http://localhost:5000)
npm run dev
```

### Environment Variables (Optional)

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token — increases API rate limit from 60 to 5,000 req/hr | Optional |

To add a token, create a `.env` file in the root:

```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

> Without a token the app works fine, but heavy usage may hit GitHub's 60 requests/hour unauthenticated limit.

---

## ☁️ Deploy to Vercel

The project is pre-configured for one-click Vercel deployment.

### Option A — Vercel Dashboard (Recommended)

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add the environment variable `GITHUB_TOKEN` (optional but recommended)
4. Click **Deploy** — that's it.

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

When prompted, add `GITHUB_TOKEN` as an environment variable in the Vercel dashboard under **Settings → Environment Variables**.

---

## 📐 Project Structure

```
Repository-Insights/
├── api/
│   └── index.ts          # Vercel serverless function adapter
├── client/
│   └── src/
│       ├── components/   # UI components (RepoDashboard, ProfileDashboard, etc.)
│       ├── hooks/        # Custom hooks (use-analyze, use-history)
│       ├── pages/        # Home page
│       └── context/      # App context (theme, language)
├── server/
│   ├── index.ts          # Express server entry point
│   ├── routes.ts         # API routes + GitHub data fetching
│   ├── storage.ts        # DB / in-memory cache layer
│   └── db.ts             # Optional PostgreSQL connection
├── shared/
│   ├── schema.ts         # Zod schemas + DB schema
│   └── routes.ts         # API type definitions
├── vercel.json           # Vercel deployment configuration
└── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analyze?url=<github_url>` | Analyze a GitHub repo or profile |
| `GET` | `/api/compare?urlA=<url>&urlB=<url>` | Compare two GitHub repositories |

### Example

```bash
# Analyze a profile
curl "https://gitvitals.vercel.app/api/analyze?url=https://github.com/torvalds"

# Analyze a repository
curl "https://gitvitals.vercel.app/api/analyze?url=https://github.com/vercel/next.js"

# Compare two repos
curl "https://gitvitals.vercel.app/api/compare?urlA=https://github.com/facebook/react&urlB=https://github.com/vuejs/vue"
```

---

## 📊 Scoring Systems

### Developer Score (0–100)
Computed from public repos, total stars, followers, account age, and community impact.

| Range | Level |
|-------|-------|
| 90–100 | 🏆 Elite Developer |
| 75–89 | ⚡ Advanced Developer |
| 50–74 | 🔥 Active Developer |
| 25–49 | 🌱 Beginner |
| 0–24 | 💤 Inactive |

### Repository Health Score (0–100)
Based on license, issue activity, contributors, stars, wiki, and topics.

### Risk Score (0–100)
Evaluates commit recency, bus factor, open issues, and license presence.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ by [kutluhangil](https://github.com/kutluhangil)

<br />

*If you find this useful, consider giving it a ⭐*

</div>
