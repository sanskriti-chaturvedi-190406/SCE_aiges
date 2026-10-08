import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const location = v.object({
  latitude: v.number(),
  longitude: v.number(),
  address: v.optional(v.string()),
  accuracy: v.optional(v.number()),
});

// Victim creates a new help request
export const createRequest = mutation({
  args: {
    type: v.string(),
    description: v.optional(v.string()),
    peopleCount: v.number(),
    location,
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User is not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("Aegis user profile not found");
    }

    if (user.role !== "victim") {
      throw new Error("Only victims can create help requests");
    }

    const requestId = await ctx.db.insert("requests", {
      victimId: user._id,
      type: args.type,
      description: args.description,
      peopleCount: args.peopleCount,
      location: args.location,
      status: "pending",
      createdAt: Date.now(),
    });

    console.log("[Aegis] Help request created:", requestId);

    return requestId;
  },
});

// Victim gets their own requests
export const getMyRequests = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("requests")
      .withIndex("by_victimId", (q) =>
        q.eq("victimId", user._id)
      )
      .collect();
  },
});

// Volunteer gets pending requests
export const getAvailableRequests = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user || user.role !== "volunteer") {
      return [];
    }

    const requests = await ctx.db
      .query("requests")
      .collect();

    return requests.filter(
      (request) => request.status === "pending"
    );
  },
});

// Volunteer accepts a pending request
export const acceptRequest = mutation({
  args: {
    requestId: v.id("requests"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User is not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("Aegis user profile not found");
    }

    if (user.role !== "volunteer") {
      throw new Error("Only volunteers can accept requests");
    }

    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Request is no longer available");
    }

    await ctx.db.patch(args.requestId, {
      volunteerId: user._id,
      status: "in_progress",
      acceptedAt: Date.now(),
    });

    console.log(
      "[Aegis] Request accepted:",
      args.requestId,
      "by volunteer:",
      user._id
    );

    return args.requestId;
  },
});