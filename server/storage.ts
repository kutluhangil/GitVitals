import { analyses, type Analysis, type InsertAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAnalysisByUrl(repoUrl: string): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
}

export class DatabaseStorage implements IStorage {
  async getAnalysisByUrl(repoUrl: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.repoUrl, repoUrl));
    return analysis;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db.insert(analyses).values(insertAnalysis).returning();
    return analysis;
  }
}

export const storage = new DatabaseStorage();
