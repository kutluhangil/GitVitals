import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Helper to parse GitHub URLs (repo or profile)
function parseGitHubUrl(url: string): { type: 'repo' | 'profile'; owner: string; repo?: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null;
    
    let pathname = parsed.pathname;
    if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    
    const parts = pathname.split("/").filter(Boolean);
    
    if (parts.length === 0) return null;
    
    // Profile URL: https://github.com/username
    if (parts.length === 1) {
      return { type: 'profile', owner: parts[0] };
    }
    
    // Repository URL: https://github.com/owner/repo
    if (parts.length >= 2) {
      return { type: 'repo', owner: parts[0], repo: parts[1] };
    }
    
    return null;
  } catch {
    return null;
  }
}

async function fetchGitHubProfileData(username: string) {
  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "GitVitals-App",
    ...(process.env.GITHUB_TOKEN ? { "Authorization": `Bearer ${process.env.GITHUB_TOKEN}` } : {})
  };

  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) {
      if (userRes.status === 404) throw new Error("GitHub profile not found");
      throw new Error(`GitHub API error: ${userRes.statusText}`);
    }
    const userInfo = await userRes.json();
    
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=5`, { headers });
    const repos = reposRes.ok ? await reposRes.json() : [];

    return {
      type: 'profile',
      overview: {
        username: userInfo.login,
        name: userInfo.name || userInfo.login,
        bio: userInfo.bio,
        followers: userInfo.followers,
        following: userInfo.following,
        publicRepos: userInfo.public_repos,
        avatarUrl: userInfo.avatar_url,
        location: userInfo.location,
        createdAt: userInfo.created_at,
      },
      topRepos: repos.map((r: any) => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        description: r.description,
      })),
      stats: {
        totalStars: repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0),
        totalForks: repos.reduce((sum: number, r: any) => sum + r.forks_count, 0),
      }
    };
  } catch (err: any) {
    throw err;
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
      const inputUrl = req.query.url;
      if (!inputUrl || typeof inputUrl !== "string") {
        return res.status(400).json({ message: "GitHub URL is required" });
      }

      const parsedInfo = parseGitHubUrl(inputUrl);
      if (!parsedInfo) {
        return res.status(400).json({ message: "Invalid GitHub URL. Please provide a valid repository or profile URL (e.g., https://github.com/facebook/react or https://github.com/gaearon)" });
      }

      // Check if we have a recent cached analysis (within last 1 hour)
      const existing = await storage.getAnalysisByUrl(inputUrl);
      if (existing) {
        const ageInHours = (Date.now() - new Date(existing.createdAt).getTime()) / (1000 * 60 * 60);
        if (ageInHours < 1) {
          return res.json(existing.data);
        }
      }

      let analysisData;

      if (parsedInfo.type === 'repo' && parsedInfo.repo) {
        // Repository analysis
        analysisData = await fetchGitHubData(parsedInfo.owner, parsedInfo.repo);
      } else if (parsedInfo.type === 'profile') {
        // For now, fetch the user's first repo as a demo, or fetch profile data
        // This is a simplified version - a full implementation would fetch comprehensive profile data
        analysisData = await fetchGitHubProfileData(parsedInfo.owner);
      } else {
        return res.status(400).json({ message: "Unable to determine analysis type" });
      }

      // Save to database
      try {
        if (!existing) {
          await storage.createAnalysis({
            repoUrl: inputUrl,
            owner: parsedInfo.owner,
            name: parsedInfo.repo || 'profile',
            data: analysisData,
          });
        }
      } catch (dbError) {
        console.error("Failed to cache analysis:", dbError);
        // Continue even if caching fails
      }

      res.json(analysisData);
    } catch (err: any) {
      console.error("Analysis error:", err);
      if (err.message?.includes("rate limit")) {
        return res.status(429).json({ message: "GitHub API rate limit exceeded. Please try again later." });
      }
      if (err.message?.includes("not found") || err.message?.includes("404")) {
        return res.status(404).json({ message: "Repository or profile not found. Please check the URL and try again." });
      }
      res.status(500).json({ message: err.message || "Failed to analyze GitHub URL" });
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
