import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAnalyzeRepo(repoUrl: string | null) {
  return useQuery({
    queryKey: [api.analyze.get.path, repoUrl],
    queryFn: async () => {
      if (!repoUrl) return null;
      const res = await fetch(`${api.analyze.get.path}?url=${encodeURIComponent(repoUrl)}`, { credentials: "include" });
      if (!res.ok) {
        let errorMsg = "Failed to analyze";
        try { const d = await res.json(); if (d.message) errorMsg = d.message; } catch {}
        throw new Error(errorMsg);
      }
      return res.json();
    },
    enabled: !!repoUrl,
    retry: false,
  });
}

export function useCompareRepos(urlA: string | null, urlB: string | null) {
  return useQuery({
    queryKey: [api.compare.get.path, urlA, urlB],
    queryFn: async () => {
      if (!urlA || !urlB) return null;
      const res = await fetch(
        `${api.compare.get.path}?urlA=${encodeURIComponent(urlA)}&urlB=${encodeURIComponent(urlB)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        let errorMsg = "Failed to compare repositories";
        try { const d = await res.json(); if (d.message) errorMsg = d.message; } catch {}
        throw new Error(errorMsg);
      }
      return res.json();
    },
    enabled: !!urlA && !!urlB,
    retry: false,
  });
}
