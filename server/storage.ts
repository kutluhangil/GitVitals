import { analyses, type Analysis, type InsertAnalysis } from "@shared/schema";
import { db, hasDatabase } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAnalysisByUrl(repoUrl: string): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
}

// In-memory fallback for local development (no database required)
class MemoryStorage implements IStorage {
  private cache = new Map<string, Analysis>();
  private nextId = 1;

  async getAnalysisByUrl(repoUrl: string): Promise<Analysis | undefined> {
    return this.cache.get(repoUrl);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const analysis: Analysis = {
      id: this.nextId++,
      repoUrl: insertAnalysis.repoUrl,
      owner: insertAnalysis.owner,
      name: insertAnalysis.name,
      data: insertAnalysis.data,
      createdAt: new Date(),
    };
    this.cache.set(analysis.repoUrl, analysis);
    return analysis;
  }
}

export class DatabaseStorage implements IStorage {
  async getAnalysisByUrl(repoUrl: string): Promise<Analysis | undefined> {
    const [analysis] = await db!.select().from(analyses).where(eq(analyses.repoUrl, repoUrl));
    return analysis;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db!.insert(analyses).values(insertAnalysis).returning();
    return analysis;
  }
}

export const storage: IStorage = hasDatabase
  ? new DatabaseStorage()
  : new MemoryStorage();

if (!hasDatabase) {
  console.warn("[storage] No DATABASE_URL found — using in-memory cache (data will not persist between restarts)");
}
