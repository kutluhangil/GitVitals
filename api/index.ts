import express from "express";
import { createServer } from "http";
import { createServer as createHttpServer } from "http";
import type { Request, Response, NextFunction } from "express";

// --- Inline @shared/schema (avoid path alias issues) ---
import { z } from "zod";

export const emailRequestSchema = z.object({
  email: z.string().email(),
  repoUrl: z.string().url(),
});

// --- Inline storage (memory mode, no DB on Vercel) ---
interface HistoryEntry {
  id: number;
  repoUrl: string;
  owner: string;
  name: string;
  data: any;
  createdAt: Date;
}

const cache = new Map<string, HistoryEntry>();
let nextId = 1;

const storage = {
  async getAnalysisByUrl(repoUrl: string): Promise<HistoryEntry | undefined> {
    return cache.get(repoUrl);
  },
  async createAnalysis(input: { repoUrl: string; owner: string; name: string; data: any }): Promise<HistoryEntry> {
    const entry: HistoryEntry = { id: nextId++, createdAt: new Date(), ...input };
    cache.set(input.repoUrl, entry);
    return entry;
  },
};

// --- GitHub helpers ---
const GH_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "GitVitals-App",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

function parseGitHubUrl(url: string): { type: "repo" | "profile"; owner: string; repo?: string } | null {
  try {
    let normalized = url.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;
    const parsed = new URL(normalized);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null;
    let pathname = parsed.pathname;
    if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return { type: "profile", owner: parts[0] };
    if (parts.length >= 2) return { type: "repo", owner: parts[0], repo: parts[1] };
    return null;
  } catch {
    return null;
  }
}

function detectTechStack(languages: Record<string, number>, topics: string[]): string[] {
  const stack: string[] = [];
  const langMap: Record<string, string> = {
    TypeScript: "TypeScript", JavaScript: "JavaScript", Python: "Python",
    Rust: "Rust", Go: "Go", Java: "Java", "C#": "C#", PHP: "PHP",
    Ruby: "Ruby", Kotlin: "Kotlin", Swift: "Swift", Dart: "Dart",
    "C++": "C++", C: "C", Scala: "Scala", Elixir: "Elixir",
    Haskell: "Haskell", Shell: "Shell", HTML: "HTML", CSS: "CSS",
  };
  const topicMap: Record<string, string> = {
    react: "React", reactjs: "React", "react-native": "React Native",
    nextjs: "Next.js", "next-js": "Next.js", vue: "Vue.js", vuejs: "Vue.js",
    angular: "Angular", svelte: "Svelte", astro: "Astro",
    nodejs: "Node.js", "node-js": "Node.js", node: "Node.js",
    express: "Express", fastify: "Fastify", nestjs: "NestJS",
    fastapi: "FastAPI", django: "Django", flask: "Flask",
    tailwindcss: "Tailwind CSS", tailwind: "Tailwind CSS",
    docker: "Docker", kubernetes: "Kubernetes",
    postgresql: "PostgreSQL", postgres: "PostgreSQL", mysql: "MySQL",
    mongodb: "MongoDB", redis: "Redis", sqlite: "SQLite",
    graphql: "GraphQL", prisma: "Prisma", drizzle: "DrizzleORM",
    trpc: "tRPC", vite: "Vite", webpack: "Webpack",
    pytorch: "PyTorch", tensorflow: "TensorFlow",
    spring: "Spring", laravel: "Laravel", rails: "Rails",
  };
  for (const lang of Object.keys(languages)) {
    const name = langMap[lang];
    if (name && !stack.includes(name)) stack.push(name);
  }
  for (const topic of topics) {
    const name = topicMap[topic.toLowerCase()];
    if (name && !stack.includes(name)) stack.push(name);
  }
  return stack.slice(0, 12);
}

function calculateRiskScore(repoInfo: any, commits: any[], contributors: any[]) {
  let riskScore = 0;
  const warnings: string[] = [];
  const lastCommitDate = commits[0]?.commit?.author?.date;
  if (lastCommitDate) {
    const daysSince = (Date.now() - new Date(lastCommitDate).getTime()) / 86400000;
    if (daysSince > 365) { riskScore += 35; warnings.push("No commits in over a year"); }
    else if (daysSince > 180) { riskScore += 20; warnings.push("No commits in 6+ months"); }
    else if (daysSince > 90) { riskScore += 10; warnings.push("Low commit activity (90+ days since last commit)"); }
  } else { riskScore += 20; warnings.push("Unable to determine last commit date"); }
  if (contributors.length === 1) { riskScore += 25; warnings.push("Single contributor — extreme bus factor risk"); }
  else if (contributors.length < 3) { riskScore += 12; warnings.push("Very few contributors"); }
  const openIssues = repoInfo.open_issues_count || 0;
  if (openIssues > 1000) { riskScore += 20; warnings.push("Extremely high open issue count"); }
  else if (openIssues > 200) { riskScore += 10; warnings.push("High open issue count"); }
  if (!repoInfo.license) { riskScore += 10; warnings.push("No license found"); }
  if (commits.length < 10) { riskScore += 10; warnings.push("Very few commits in history"); }
  const totalScore = Math.min(100, riskScore);
  let riskLevel = "Low Risk";
  if (totalScore >= 50) riskLevel = "High Risk";
  else if (totalScore >= 25) riskLevel = "Medium Risk";
  return { riskScore: totalScore, riskLevel, warnings };
}

function calculateDeveloperScore(userInfo: any, repos: any[]): { score: number; level: string } {
  let score = 0;
  score += Math.min(15, ((userInfo.public_repos || 0) / 50) * 15);
  const totalStars = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0);
  score += Math.min(25, (totalStars / 500) * 25);
  score += Math.min(15, ((userInfo.followers || 0) / 200) * 15);
  const years = (Date.now() - new Date(userInfo.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
  score += Math.min(10, (years / 5) * 10);
  const originalRepos = repos.filter((r: any) => !r.fork);
  score += Math.min(10, (originalRepos.length / 30) * 10);
  if (repos.some((r: any) => r.forks_count > 10 || r.stargazers_count > 50)) score += 15;
  else if (repos.some((r: any) => r.forks_count > 0)) score += 7;
  if (totalStars > 1000) score += 10;
  else if (totalStars > 100) score += 5;
  const finalScore = Math.min(100, Math.round(score));
  let level = "Inactive";
  if (finalScore >= 90) level = "Elite Developer";
  else if (finalScore >= 75) level = "Advanced Developer";
  else if (finalScore >= 50) level = "Active Developer";
  else if (finalScore >= 25) level = "Beginner";
  return { score: finalScore, level };
}

async function fetchGitHubProfileData(username: string) {
  const fetchJson = async (url: string) => {
    const res = await fetch(url, { headers: GH_HEADERS });
    if (!res.ok) {
      if (res.status === 404) throw new Error("GitHub profile not found");
      if (res.status === 403 || res.status === 429) throw new Error("GitHub API rate limit exceeded");
      throw new Error(`GitHub API error: ${res.statusText}`);
    }
    return res.json();
  };
  const userInfo = await fetchJson(`https://api.github.com/users/${username}`);
  const repos = await fetchJson(`https://api.github.com/users/${username}/repos?sort=stars&per_page=100`);
  const languageCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
  }
  const totalLangCount = Object.values(languageCounts).reduce((a, b) => a + b, 0);
  const languageExpertise = Object.entries(languageCounts)
    .map(([name, count]) => ({ name, percentage: totalLangCount > 0 ? Math.round((count / totalLangCount) * 100) : 0 }))
    .sort((a, b) => b.percentage - a.percentage).slice(0, 6);
  const totalStars = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((s: number, r: any) => s + (r.forks_count || 0), 0);
  const avgStars = repos.length > 0 ? Math.round(totalStars / repos.length) : 0;
  const mostStarred = repos.reduce((best: any, r: any) => (!best || r.stargazers_count > best.stargazers_count ? r : best), null);
  const mostForked = repos.reduce((best: any, r: any) => (!best || r.forks_count > best.forks_count ? r : best), null);
  const developerScore = calculateDeveloperScore(userInfo, repos);
  return {
    type: "profile",
    overview: {
      username: userInfo.login, name: userInfo.name || userInfo.login, bio: userInfo.bio,
      followers: userInfo.followers, following: userInfo.following,
      publicRepos: userInfo.public_repos, avatarUrl: userInfo.avatar_url,
      location: userInfo.location, company: userInfo.company, blog: userInfo.blog,
      createdAt: userInfo.created_at, htmlUrl: userInfo.html_url,
    },
    topRepos: repos.slice(0, 6).map((r: any) => ({
      name: r.name, stars: r.stargazers_count, forks: r.forks_count,
      description: r.description, language: r.language, url: r.html_url,
    })),
    languageExpertise,
    portfolio: {
      totalStars, totalForks, avgStars,
      mostStarred: mostStarred ? { name: mostStarred.name, stars: mostStarred.stargazers_count } : null,
      mostForked: mostForked ? { name: mostForked.name, forks: mostForked.forks_count } : null,
      originalRepos: repos.filter((r: any) => !r.fork).length,
    },
    stats: { totalStars, totalForks },
    developerScore,
  };
}

async function fetchGitHubData(owner: string, repo: string) {
  const fetchJson = async (endpoint: string) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${endpoint}`, { headers: GH_HEADERS });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Repository not found or is private");
      if (res.status === 403 || res.status === 429) throw new Error("GitHub API rate limit exceeded");
      throw new Error(`GitHub API error: ${res.statusText}`);
    }
    return res.json();
  };
  const [repoInfo, languages, commits, contributors] = await Promise.all([
    fetchJson(""),
    fetchJson("/languages"),
    fetchJson("/commits?per_page=100").catch(() => []),
    fetchJson("/contributors?per_page=100").catch(() => []),
  ]);
  const topics: string[] = repoInfo.topics || [];
  const totalContributors = contributors.length;
  let busFactor = 0;
  if (totalContributors > 0) {
    const totalContributions = contributors.reduce((s: number, c: any) => s + c.contributions, 0);
    let cumulative = 0;
    for (const c of contributors) {
      cumulative += c.contributions;
      busFactor++;
      if (cumulative >= totalContributions * 0.5) break;
    }
  }
  let healthScore = 50;
  if (repoInfo.has_issues) healthScore += 5;
  if (repoInfo.license) healthScore += 10;
  if (commits.length > 50) healthScore += 10;
  if (totalContributors > 5) healthScore += 10;
  if (repoInfo.stargazers_count > 100) healthScore += 10;
  if (repoInfo.description) healthScore += 5;
  if (topics.length > 0) healthScore += 5;
  if (repoInfo.has_wiki) healthScore += 5;
  healthScore = Math.min(100, Math.max(0, healthScore));
  let healthStatus = "Inactive";
  if (healthScore >= 90) healthStatus = "Excellent";
  else if (healthScore >= 75) healthStatus = "Healthy";
  else if (healthScore >= 50) healthStatus = "Moderate";
  else if (healthScore >= 30) healthStatus = "Risky";
  const totalBytes = Object.values(languages).reduce((a: any, b: any) => a + b, 0) as number;
  const languageStats = Object.entries(languages)
    .map(([lang, bytes]) => ({ name: lang, percentage: totalBytes > 0 ? Math.round(((bytes as number) / totalBytes) * 100) : 0 }))
    .sort((a, b) => b.percentage - a.percentage).slice(0, 6);
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekBuckets: Record<number, number> = {};
  for (let i = 11; i >= 0; i--) weekBuckets[i] = 0;
  for (const commit of commits) {
    const date = new Date(commit.commit?.author?.date || 0).getTime();
    const weeksAgo = Math.floor((now - date) / weekMs);
    if (weeksAgo >= 0 && weeksAgo < 12) weekBuckets[11 - weeksAgo] = (weekBuckets[11 - weeksAgo] || 0) + 1;
  }
  const commitsTrend = Object.entries(weekBuckets).map(([week, count]) => ({ date: `W${parseInt(week) + 1}`, count }));
  const risk = calculateRiskScore(repoInfo, commits, contributors);
  const techStack = detectTechStack(languages, topics);
  return {
    type: "repo",
    overview: {
      name: repoInfo.name, owner: repoInfo.owner.login, avatarUrl: repoInfo.owner.avatar_url,
      htmlUrl: repoInfo.html_url, description: repoInfo.description,
      createdAt: repoInfo.created_at, lastUpdated: repoInfo.updated_at,
      defaultBranch: repoInfo.default_branch, license: repoInfo.license?.name || "None",
      size: repoInfo.size, visibility: repoInfo.visibility, topics,
    },
    metrics: { totalCommits: commits.length === 100 ? "100+" : commits.length, lastCommitDate: commits[0]?.commit?.author?.date || null },
    contributors: {
      total: totalContributors,
      top: contributors.slice(0, 5).map((c: any) => ({
        login: c.login, avatar_url: c.avatar_url, contributions: c.contributions, htmlUrl: `https://github.com/${c.login}`,
      })),
      busFactor,
    },
    languages: languageStats,
    activity: { commitsTrend },
    popularity: { stars: repoInfo.stargazers_count, forks: repoInfo.forks_count, watchers: repoInfo.subscribers_count, openIssues: repoInfo.open_issues_count },
    health: { score: healthScore, status: healthStatus },
    risk,
    techStack,
  };
}

// --- Express app ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for Vercel
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  next();
});

app.get("/api/analyze", async (req: Request, res: Response) => {
  try {
    const inputUrl = req.query.url;
    if (!inputUrl || typeof inputUrl !== "string") return res.status(400).json({ message: "GitHub URL is required" }) as any;
    const parsedInfo = parseGitHubUrl(inputUrl);
    if (!parsedInfo) return res.status(400).json({ message: "Invalid GitHub URL." }) as any;
    const existing = await storage.getAnalysisByUrl(inputUrl);
    if (existing) {
      const ageInHours = (Date.now() - new Date(existing.createdAt).getTime()) / 3600000;
      if (ageInHours < 1) return res.json(existing.data) as any;
    }
    let analysisData: any;
    if (parsedInfo.type === "repo" && parsedInfo.repo) {
      analysisData = await fetchGitHubData(parsedInfo.owner, parsedInfo.repo);
    } else if (parsedInfo.type === "profile") {
      analysisData = await fetchGitHubProfileData(parsedInfo.owner);
    } else {
      return res.status(400).json({ message: "Unable to determine analysis type" }) as any;
    }
    try {
      if (!existing) await storage.createAnalysis({ repoUrl: inputUrl, owner: parsedInfo.owner, name: parsedInfo.repo || "profile", data: analysisData });
    } catch {}
    res.json(analysisData);
  } catch (err: any) {
    if (err.message?.includes("rate limit")) return res.status(429).json({ message: "GitHub API rate limit exceeded. Please try again later." }) as any;
    if (err.message?.includes("not found") || err.message?.includes("404")) return res.status(404).json({ message: "Repository or profile not found." }) as any;
    res.status(500).json({ message: err.message || "Failed to analyze" });
  }
});

app.get("/api/compare", async (req: Request, res: Response) => {
  try {
    const { urlA, urlB } = req.query;
    if (!urlA || !urlB || typeof urlA !== "string" || typeof urlB !== "string")
      return res.status(400).json({ message: "Two GitHub repository URLs are required (urlA and urlB)" }) as any;
    const parsedA = parseGitHubUrl(urlA);
    const parsedB = parseGitHubUrl(urlB);
    if (!parsedA || parsedA.type !== "repo" || !parsedA.repo) return res.status(400).json({ message: "urlA must be a valid GitHub repository URL" }) as any;
    if (!parsedB || parsedB.type !== "repo" || !parsedB.repo) return res.status(400).json({ message: "urlB must be a valid GitHub repository URL" }) as any;
    const [repoA, repoB] = await Promise.all([fetchGitHubData(parsedA.owner, parsedA.repo), fetchGitHubData(parsedB.owner, parsedB.repo)]);
    res.json({ repoA, repoB });
  } catch (err: any) {
    if (err.message?.includes("rate limit")) return res.status(429).json({ message: "GitHub API rate limit exceeded." }) as any;
    if (err.message?.includes("not found")) return res.status(404).json({ message: "One or both repositories not found." }) as any;
    res.status(500).json({ message: err.message || "Failed to compare repositories" });
  }
});

app.post("/api/email", async (req: Request, res: Response) => {
  res.json({ success: true, message: "Report feature not available." });
});

// ───────────────────────────────────────────────────────────────────────────
// /api/card  –  Dynamic SVG Developer Card (for GitHub README embeds)
// ───────────────────────────────────────────────────────────────────────────
const LANG_COLORS_SVG: Record<string, string> = {
  TypeScript:"#3178c6", JavaScript:"#f7df1e", Python:"#3776ab",
  Go:"#00add8", Rust:"#ce412b", Java:"#b07219", "C#":"#178600",
  Ruby:"#701516", PHP:"#4F5D95", Swift:"#ffac45", Kotlin:"#A97BFF",
  Dart:"#00b4ab", "C++":"#f34b7d", CSS:"#563d7c", HTML:"#e34c26",
  Shell:"#89e051",
};
function svgLangColor(l: string) { return LANG_COLORS_SVG[l] || "#6366f1"; }
function svgScoreColor(s: number) {
  if (s >= 90) return "#10b981";
  if (s >= 75) return "#4f46e5";
  if (s >= 50) return "#f59e0b";
  if (s >= 25) return "#ef4444";
  return "#6b7280";
}
function escapeXml(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
async function avatarToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "GitVitals-App" } });
    if (!response.ok) return "";
    const arrayBuf = await response.arrayBuffer();
    const b64 = Buffer.from(arrayBuf).toString("base64");
    const mime = response.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${b64}`;
  } catch { return ""; }
}

function generatePortraitSVG(user: any, avatarB64: string, sc: string): string {
  const W = 495, H = 215;
  const circ = 2 * Math.PI * 32;
  const offset = circ - ((user.score / 100) * circ);
  const langs = user.langs.slice(0, 4);

  const langBars = langs.map((l: any, i: number) => {
    const y = 140 + i * 16;
    return `
      <rect x="16" y="${y}" width="${Math.round(l.pct * 1.6)}" height="5" rx="2.5" fill="${svgLangColor(l.name)}" opacity="0.9"/>
      <text x="${Math.round(l.pct * 1.6) + 22}" y="${y + 4.5}" fill="#8b949e" font-size="9" font-family="monospace">${escapeXml(l.name)} ${l.pct}%</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1117"/><stop offset="100%" stop-color="#161b22"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="40%">
      <stop offset="0%" stop-color="${sc}" stop-opacity="0.12"/><stop offset="100%" stop-color="#0d1117" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="avatar-clip"><circle cx="41" cy="41" r="25"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)" stroke="#30363d" stroke-width="1"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#glow)"/>
  ${avatarB64 ? `<image href="${avatarB64}" x="16" y="16" width="50" height="50" clip-path="url(#avatar-clip)"/>
  <circle cx="41" cy="41" r="25" fill="none" stroke="${sc}" stroke-width="1.5" opacity="0.5"/>` : ""}
  <text x="76" y="33" fill="#f0f6fc" font-size="16" font-weight="700" font-family="Segoe UI,Ubuntu,sans-serif">${escapeXml(user.name)}</text>
  <text x="76" y="50" fill="#8b949e" font-size="11" font-family="monospace">@${escapeXml(user.username)}</text>
  <text x="76" y="66" fill="#6e7681" font-size="9" font-family="monospace">${escapeXml((user.bio || "").slice(0, 50))}${(user.bio || "").length > 50 ? "…" : ""}</text>
  <text x="${W - 16}" y="20" fill="#484f58" font-size="9" font-family="monospace" text-anchor="end" letter-spacing="2">GITVITALS</text>
  <line x1="16" y1="80" x2="${W - 16}" y2="80" stroke="#21262d" stroke-width="1"/>
  <svg x="${W - 105}" y="88" width="80" height="80" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="32" fill="none" stroke="#21262d" stroke-width="6"/>
    <circle cx="40" cy="40" r="32" fill="none" stroke="${sc}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
      transform="rotate(-90 40 40)" style="filter:drop-shadow(0 0 4px ${sc}80)"/>
    <text x="40" y="43" fill="${sc}" font-size="20" font-weight="800" font-family="monospace" text-anchor="middle">${user.score}</text>
    <text x="40" y="56" fill="#484f58" font-size="8" font-family="monospace" text-anchor="middle">/100</text>
  </svg>
  <text x="16" y="100" fill="#8b949e" font-size="9" font-family="monospace" letter-spacing="1">REPOS</text>
  <text x="16" y="115" fill="#f0f6fc" font-size="14" font-weight="700" font-family="monospace">${user.repos}</text>
  <text x="75" y="100" fill="#8b949e" font-size="9" font-family="monospace" letter-spacing="1">STARS</text>
  <text x="75" y="115" fill="#f0f6fc" font-size="14" font-weight="700" font-family="monospace">${user.stars}</text>
  <text x="134" y="100" fill="#8b949e" font-size="9" font-family="monospace" letter-spacing="1">FOLLOWERS</text>
  <text x="134" y="115" fill="#f0f6fc" font-size="14" font-weight="700" font-family="monospace">${user.followers}</text>
  <rect x="16" y="126" width="${Math.round(user.score * 2.4)}" height="3" rx="1.5" fill="${sc}" opacity="0.6"/>
  <rect x="16" y="126" width="${W - 32}" height="3" rx="1.5" fill="#21262d"/>
  <rect x="16" y="126" width="${Math.round(user.score * 2.4)}" height="3" rx="1.5" fill="${sc}" opacity="0.9"/>
  <text x="16" y="138" fill="#484f58" font-size="8" font-family="monospace">LANGUAGES</text>
  ${langBars}
  <text x="${W - 16}" y="${H - 8}" fill="#484f58" font-size="8" font-family="monospace" text-anchor="end">gitvitals.vercel.app</text>
</svg>`;
}

function generateBannerSVG(user: any, avatarB64: string, sc: string): string {
  const W = 860, H = 140;
  const circ = 2 * Math.PI * 28;
  const offset = circ - ((user.score / 100) * circ);
  const langs = user.langs.slice(0, 5);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="100%" y2="0">
      <stop offset="0%" stop-color="#0d1117"/><stop offset="50%" stop-color="#161b22"/><stop offset="100%" stop-color="#0d1117"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${sc}" stop-opacity="0.08"/><stop offset="100%" stop-color="#0d1117" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="avatar-clip"><circle cx="30" cy="30" r="22"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)" stroke="#30363d" stroke-width="1"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#glow)"/>
  ${avatarB64 ? `<image href="${avatarB64}" x="20" y="20" width="44" height="44" clip-path="url(#avatar-clip)"/>
  <circle cx="42" cy="42" r="22" fill="none" stroke="${sc}" stroke-width="1.5" opacity="0.5"/>` : ""}
  <text x="76" y="40" fill="#f0f6fc" font-size="16" font-weight="700" font-family="Segoe UI,Ubuntu,sans-serif">${escapeXml(user.name)}</text>
  <text x="76" y="57" fill="#8b949e" font-size="10" font-family="monospace">@${escapeXml(user.username)}</text>
  <text x="76" y="72" fill="#484f58" font-size="8" font-family="monospace" letter-spacing="1">${escapeXml(user.level.toUpperCase())} · ${user.since} SINCE</text>
  <line x1="240" y1="14" x2="240" y2="${H - 14}" stroke="#21262d" stroke-width="1"/>
  ${[["REPOS",user.repos,280],["STARS",user.stars,340],["FOLLOWERS",user.followers,410],["FORKS",user.forks,480]].map(([l,v,x]) => `
    <text x="${x}" y="46" fill="#8b949e" font-size="8" font-family="monospace" letter-spacing="1">${l}</text>
    <text x="${x}" y="62" fill="#f0f6fc" font-size="16" font-weight="700" font-family="monospace">${v}</text>`).join("")}
  <line x1="545" y1="14" x2="545" y2="${H - 14}" stroke="#21262d" stroke-width="1"/>
  <svg x="560" y="22" width="60" height="60" viewBox="0 0 60 60">
    <circle cx="30" cy="30" r="28" fill="none" stroke="#21262d" stroke-width="5"/>
    <circle cx="30" cy="30" r="28" fill="none" stroke="${sc}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
      transform="rotate(-90 30 30)"/>
    <text x="30" y="34" fill="${sc}" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">${user.score}</text>
  </svg>
  <text x="630" y="46" fill="#8b949e" font-size="8" font-family="monospace">DEVELOPER SCORE</text>
  ${langs.map((l: any, i: number) => `
    <circle cx="${640 + i * 38}" cy="62" r="4" fill="${svgLangColor(l.name)}"/>
    <text x="${640 + i * 38 + 8}" y="66" fill="${svgLangColor(l.name)}" font-size="9" font-family="monospace">${escapeXml(l.name)}</text>`).join("")}
  <line x1="800" y1="14" x2="800" y2="${H - 14}" stroke="#21262d" stroke-width="1"/>
  <text x="${W - 16}" y="42" fill="#484f58" font-size="9" font-family="monospace" text-anchor="end" letter-spacing="2">GIT</text>
  <text x="${W - 16}" y="54" fill="${sc}" font-size="9" font-family="monospace" text-anchor="end" letter-spacing="2">VITALS</text>
  <text x="${W - 16}" y="${H - 10}" fill="#30363d" font-size="7" font-family="monospace" text-anchor="end">gitvitals.vercel.app</text>
</svg>`;
}

app.get("/api/card", async (req: Request, res: Response) => {
  const { user, style = "premium", orientation = "portrait" } = req.query;
  if (!user || typeof user !== "string")
    return res.status(400).send("?user=username is required") as any;

  try {
    const userRes = await fetch(`https://api.github.com/users/${user}`, { headers: GH_HEADERS });
    if (!userRes.ok) return res.status(404).send("User not found") as any;
    const userInfo = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${user}/repos?sort=stars&per_page=100`, { headers: GH_HEADERS });
    const repos = reposRes.ok ? await reposRes.json() : [];

    const langCounts: Record<string, number> = {};
    for (const r of repos) if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
    const langs = Object.entries(langCounts)
      .map(([name, c]) => ({ name, pct: total > 0 ? Math.round((c / total) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct).slice(0, 5);

    const totalStars = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((s: number, r: any) => s + (r.forks_count || 0), 0);
    const years = (Date.now() - new Date(userInfo.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const origRepos = repos.filter((r: any) => !r.fork).length;
    const starsScore = Math.min(25, (totalStars / 500) * 25);
    const followScore = Math.min(15, (userInfo.followers / 200) * 15);
    const reposScore = Math.min(15, (userInfo.public_repos / 50) * 15);
    const ageScore = Math.min(10, (years / 5) * 10);
    const origScore = Math.min(10, (origRepos / 30) * 10);
    const communityScore = (totalStars > 1000 || totalForks > 50) ? 15 : (totalForks > 0 || totalStars > 0) ? 7 : 0;
    const bonusScore = totalStars > 1000 ? 10 : totalStars > 100 ? 5 : 0;
    const score = Math.min(100, Math.round(starsScore + followScore + reposScore + ageScore + origScore + communityScore + bonusScore));
    let level = "Inactive";
    if (score >= 90) level = "Elite Developer";
    else if (score >= 75) level = "Advanced Developer";
    else if (score >= 50) level = "Active Developer";
    else if (score >= 25) level = "Beginner";

    const avatarB64 = await avatarToBase64(userInfo.avatar_url);
    const sc = svgScoreColor(score);

    const userData = {
      name: userInfo.name || userInfo.login,
      username: userInfo.login,
      bio: userInfo.bio || "",
      repos: userInfo.public_repos,
      followers: userInfo.followers,
      stars: totalStars >= 1000 ? `${(totalStars / 1000).toFixed(1)}k` : String(totalStars),
      forks: String(totalForks),
      score, level, langs,
      since: new Date(userInfo.created_at).getFullYear(),
    };

    const svg = orientation === "banner"
      ? generateBannerSVG(userData, avatarB64, sc)
      : generatePortraitSVG(userData, avatarB64, sc);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(svg);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to generate card" });
  }
});

export default app;
