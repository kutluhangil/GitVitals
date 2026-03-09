import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Helper to extract owner and repo from a GitHub URL
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchGitHubData(owner: string, repo: string) {
  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "GitVitals-App",
    ...(process.env.GITHUB_TOKEN ? { "Authorization": `Bearer ${process.env.GITHUB_TOKEN}` } : {})
  };

  const fetchJson = async (endpoint: string) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${endpoint}`, { headers });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Repository not found or is private");
      if (res.status === 403 || res.status === 429) throw new Error("GitHub API rate limit exceeded");
      throw new Error(`GitHub API error: ${res.statusText}`);
    }
    return res.json();
  };

  const [repoInfo, languages, commits, contributors, issues] = await Promise.all([
    fetchJson(""),
    fetchJson("/languages"),
    fetchJson("/commits?per_page=100").catch(() => []), // Fallback for empty repos
    fetchJson("/contributors?per_page=100").catch(() => []),
    fetchJson("/issues?state=all&per_page=100").catch(() => []),
  ]);

  // Calculate some insights
  const totalCommits = commits.length; // Approximate from first page
  const totalContributors = contributors.length;
  
  let busFactor = 0;
  if (totalContributors > 0) {
    const totalContributions = contributors.reduce((sum: number, c: any) => sum + c.contributions, 0);
    let cumulative = 0;
    for (const c of contributors) {
      cumulative += c.contributions;
      busFactor++;
      if (cumulative >= totalContributions * 0.5) break; // 50% of commits
    }
  }

  // Calculate health score (0-100)
  let healthScore = 50;
  if (repoInfo.has_issues) healthScore += 10;
  if (repoInfo.license) healthScore += 10;
  if (commits.length > 50) healthScore += 10;
  if (contributors.length > 5) healthScore += 10;
  if (repoInfo.stargazers_count > 100) healthScore += 10;
  healthScore = Math.min(100, Math.max(0, healthScore));

  let healthStatus = "Inactive";
  if (healthScore >= 90) healthStatus = "Excellent";
  else if (healthScore >= 75) healthStatus = "Healthy";
  else if (healthScore >= 50) healthStatus = "Moderate";
  else if (healthScore >= 30) healthStatus = "Risky";

  // Parse languages into percentages
  const totalBytes = Object.values(languages).reduce((a: any, b: any) => a + b, 0) as number;
  const languageStats = Object.entries(languages).map(([lang, bytes]) => ({
    name: lang,
    percentage: totalBytes > 0 ? Math.round(((bytes as number) / totalBytes) * 100) : 0
  })).sort((a, b) => b.percentage - a.percentage).slice(0, 5);

  return {
    overview: {
      name: repoInfo.name,
      owner: repoInfo.owner.login,
      description: repoInfo.description,
      createdAt: repoInfo.created_at,
      lastUpdated: repoInfo.updated_at,
      defaultBranch: repoInfo.default_branch,
      license: repoInfo.license?.name || "None",
      size: repoInfo.size, // in KB
      visibility: repoInfo.visibility,
    },
    metrics: {
      totalCommits: totalCommits === 100 ? "100+" : totalCommits, // Simplified, since we only fetch 1 page
      lastCommitDate: commits[0]?.commit?.author?.date || null,
    },
    contributors: {
      total: totalContributors,
      top: contributors.slice(0, 5).map((c: any) => ({
        login: c.login,
        avatar_url: c.avatar_url,
        contributions: c.contributions
      })),
      busFactor
    },
    languages: languageStats,
    popularity: {
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      watchers: repoInfo.subscribers_count,
      openIssues: repoInfo.open_issues_count,
    },
    health: {
      score: healthScore,
      status: healthStatus
    }
  };
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.analyze.get.path, async (req, res) => {
    try {
      const repoUrl = req.query.url;
      if (!repoUrl || typeof repoUrl !== "string") {
        return res.status(400).json({ message: "Repository URL is required" });
      }

      const parsedInfo = parseGitHubUrl(repoUrl);
      if (!parsedInfo) {
        return res.status(400).json({ message: "Invalid GitHub repository URL" });
      }

      // Check if we have a recent cached analysis (within last 1 hour)
      const existing = await storage.getAnalysisByUrl(repoUrl);
      if (existing) {
        const ageInHours = (Date.now() - new Date(existing.createdAt).getTime()) / (1000 * 60 * 60);
        if (ageInHours < 1) {
          return res.json(existing.data);
        }
      }

      // Fetch fresh data from GitHub
      const analysisData = await fetchGitHubData(parsedInfo.owner, parsedInfo.repo);

      // Save to database
      try {
        if (!existing) {
          await storage.createAnalysis({
            repoUrl,
            owner: parsedInfo.owner,
            name: parsedInfo.repo,
            data: analysisData,
          });
        }
      } catch (dbError) {
        console.error("Failed to cache analysis:", dbError);
        // Continue even if caching fails
      }

      res.json(analysisData);
    } catch (err: any) {
      if (err.message?.includes("rate limit")) {
        return res.status(429).json({ message: err.message });
      }
      if (err.message?.includes("not found")) {
        return res.status(404).json({ message: err.message });
      }
      console.error("Analysis error:", err);
      res.status(500).json({ message: "Failed to analyze repository" });
    }
  });

  app.post(api.email.send.path, async (req, res) => {
    try {
      const input = api.email.send.input.parse(req.body);
      // Mock email sending functionality
      console.log(`Mock: Sending analysis report for ${input.repoUrl} to ${input.email}`);
      res.json({ success: true, message: "Report sent successfully to " + input.email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
