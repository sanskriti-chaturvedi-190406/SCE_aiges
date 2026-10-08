import { ConvexClient } from "convex/browser";

console.log("[Aegis] Loading Convex client...");

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is missing from .env.local");
}

export const convex = new ConvexClient(convexUrl);

console.log("[Aegis] Convex client initialized");