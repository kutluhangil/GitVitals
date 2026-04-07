const HISTORY_KEY = "gitvitals_history";
const MAX_HISTORY = 10;

export interface HistoryItem {
  url: string;
  name: string;
  type: "profile" | "repo";
  avatarUrl?: string;
  analyzedAt: number; // timestamp
}

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: HistoryItem) {
  try {
    const prev = getHistory().filter((h) => h.url !== item.url);
    const updated = [item, ...prev].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
