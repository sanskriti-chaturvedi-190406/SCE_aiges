import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    console.log("[Aegis] Convex identity:", identity);

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    console.log("[Aegis] Aegis user:", user);

    return user;
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("victim"),
      v.literal("volunteer"),
      v.literal("stationOp"),
      v.literal("shelterOp")
    ),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    console.log("[Aegis] Creating user for identity:", identity);

    if (!identity) {
      throw new Error("User is not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (existingUser) {
      console.log("[Aegis] User already exists:", existingUser);
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: args.name,
      email: identity.email ?? "",
      phone: args.phone,
      role: args.role,
      createdAt: Date.now(),
    });

    console.log("[Aegis] New Aegis user created:", userId);

    return userId;
  },
});