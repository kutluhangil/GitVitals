import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  repoUrl: text("repo_url").notNull().unique(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true, createdAt: true });

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

export const emailRequestSchema = z.object({
  email: z.string().email(),
  repoUrl: z.string().url(),
});
export type EmailRequest = z.infer<typeof emailRequestSchema>;
