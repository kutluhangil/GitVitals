import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// We define a robust expected interface for the frontend to render the dashboard
export interface RepoAnalysisData {
  overview: {
    owner: string;
    name: string;
    description: string;
    sizeKb: number;
    license: string;
    createdAt: string;
    avatarUrl: string;
  };
  activity: {
    totalCommits: number;
    commitsTrend: Array<{ date: string; count: number }>;
  };
  contributors: {
    count: number;
    busFactor: number;
    top: Array<{ login: string; contributions: number; avatarUrl: string }>;
  };
  languages: Array<{ name: string; value: number }>;
  popularity: {
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
  };
  health: {
    score: number; // 0-100
    status: 'Excellent' | 'Healthy' | 'Moderate' | 'Risky' | 'Inactive';
    openClosedRatio: number;
    resolutionTimeHours: number;
  };
  codebase: {
    linesOfCode: number;
    totalFiles: number;
    directoryDepth: number;
  };
}

export function useAnalyzeRepo(repoUrl: string | null) {
  return useQuery({
    queryKey: [api.analyze.get.path, repoUrl],
    queryFn: async () => {
      if (!repoUrl) return null;
      
      const encodedUrl = encodeURIComponent(repoUrl);
      const url = `${api.analyze.get.path}?url=${encodedUrl}`;
      
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        let errorMsg = "Failed to analyze repository";
        try {
          const errData = await res.json();
          if (errData.message) errorMsg = errData.message;
        } catch (e) {
          // Ignore JSON parse error on error response
        }
        throw new Error(errorMsg);
      }
      
      // Parse with the ANY schema defined in routes, but cast to our expected structure
      const rawData = api.analyze.get.responses[200].parse(await res.json());
      return rawData as RepoAnalysisData;
    },
    enabled: !!repoUrl,
    retry: false, // Don't retry automatically as it might be a slow operation
  });
}
