import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import { z } from "zod";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let routesRegistered = false;

async function ensureRoutes() {
  if (!routesRegistered) {
    const httpServer = createServer(app);
    await registerRoutes(httpServer, app);
    routesRegistered = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureRoutes();

  return new Promise<void>((resolve, reject) => {
    // @ts-ignore
    app(req, res);
    res.on("finish", resolve);
    res.on("error", reject);
  });
}
