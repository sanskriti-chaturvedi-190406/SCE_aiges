import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const location = v.object({
  latitude: v.number(),
  longitude: v.number(),
  address: v.optional(v.string()),
  accuracy: v.optional(v.number()),
});

// --------------------------------------------------
// Helper: get the currently authenticated Aegis user
// --------------------------------------------------

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("User is not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) =>
      q.eq("clerkId", identity.subject)
    )
    .unique();

  if (!user) {
    throw new Error("Aegis user profile not found");
  }

  return user;
}

// --------------------------------------------------
// Register a relief station
// --------------------------------------------------

export const registerReliefStation = mutation({
  args: {
    name: v.string(),
    location,
    status: v.string(),
    contactPhone: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (user.role !== "stationOp") {
      throw new Error("Only relief station operators can register a station");
    }

    const stationId = await ctx.db.insert("reliefStations", {
      name: args.name,
      operatorId: user._id,
      location: args.location,
      status: args.status,
      verificationStatus: "pending",
      contactPhone: args.contactPhone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("[Aegis] Relief station registered:", stationId);

    return stationId;
  },
});

// --------------------------------------------------
// Update station status
// --------------------------------------------------

export const updateReliefStationStatus = mutation({
  args: {
    stationId: v.id("reliefStations"),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const station = await ctx.db.get(args.stationId);

    if (!station) {
      throw new Error("Relief station not found");
    }

    if (
      user.role !== "admin" &&
      station.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to update this station");
    }

    await ctx.db.patch(args.stationId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.stationId;
  },
});

// --------------------------------------------------
// Add a new resource type to a station
// --------------------------------------------------

export const addResource = mutation({
  args: {
    stationId: v.id("reliefStations"),
    type: v.string(),
    quantity: v.number(),
    unit: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const station = await ctx.db.get(args.stationId);

    if (!station) {
      throw new Error("Relief station not found");
    }

    if (
      user.role !== "admin" &&
      station.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this station");
    }

    const resourceId = await ctx.db.insert("resources", {
      stationId: args.stationId,
      type: args.type,
      quantity: args.quantity,
      unit: args.unit,
      updatedAt: Date.now(),
    });

    return resourceId;
  },
});

// --------------------------------------------------
// Add stock to an existing resource
// --------------------------------------------------

export const addStock = mutation({
  args: {
    resourceId: v.id("resources"),
    quantity: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const resource = await ctx.db.get(args.resourceId);

    if (!resource) {
      throw new Error("Resource not found");
    }

    const station = await ctx.db.get(resource.stationId);

    if (!station) {
      throw new Error("Relief station not found");
    }

    if (
      user.role !== "admin" &&
      station.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this resource");
    }

    if (args.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    await ctx.db.patch(args.resourceId, {
      quantity: resource.quantity + args.quantity,
      updatedAt: Date.now(),
    });

    return args.resourceId;
  },
});

// --------------------------------------------------
// Set total/current stock
// --------------------------------------------------

export const updateTotalStock = mutation({
  args: {
    resourceId: v.id("resources"),
    quantity: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const resource = await ctx.db.get(args.resourceId);

    if (!resource) {
      throw new Error("Resource not found");
    }

    const station = await ctx.db.get(resource.stationId);

    if (!station) {
      throw new Error("Relief station not found");
    }

    if (
      user.role !== "admin" &&
      station.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this resource");
    }

    if (args.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    await ctx.db.patch(args.resourceId, {
      quantity: args.quantity,
      updatedAt: Date.now(),
    });

    return args.resourceId;
  },
});

// --------------------------------------------------
// Reduce stock when resources are distributed
// --------------------------------------------------

export const updateDistributedQuantity = mutation({
  args: {
    resourceId: v.id("resources"),
    quantity: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const resource = await ctx.db.get(args.resourceId);

    if (!resource) {
      throw new Error("Resource not found");
    }

    const station = await ctx.db.get(resource.stationId);

    if (!station) {
      throw new Error("Relief station not found");
    }

    if (
      user.role !== "admin" &&
      station.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this resource");
    }

    if (args.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    if (args.quantity > resource.quantity) {
      throw new Error("Distributed quantity cannot exceed available stock");
    }

    await ctx.db.patch(args.resourceId, {
      quantity: resource.quantity - args.quantity,
      updatedAt: Date.now(),
    });

    return args.resourceId;
  },
});

// --------------------------------------------------
// Admin: approve/reject a relief station
// --------------------------------------------------

export const updateVerificationStatus = mutation({
  args: {
    stationId: v.id("reliefStations"),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    ),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (user.role !== "admin") {
      throw new Error("Only admins can update verification status");
    }

    const station = await ctx.db.get(args.stationId);

    if (!station) {
      throw new Error("Relief station not found");
    }

    await ctx.db.patch(args.stationId, {
      verificationStatus: args.verificationStatus,
      updatedAt: Date.now(),
    });

    return args.stationId;
  },
});

// --------------------------------------------------
// Get station by ID
// --------------------------------------------------

export const getReliefStationById = query({
  args: {
    stationId: v.id("reliefStations"),
  },

  handler: async (ctx, args) => {
    return await ctx.db.get(args.stationId);
  },
});

// --------------------------------------------------
// Get stations belonging to current operator
// --------------------------------------------------

export const getReliefStationsByOperator = query({
  args: {},

  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    return await ctx.db
      .query("reliefStations")
      .withIndex("by_operatorId", (q) =>
        q.eq("operatorId", user._id)
      )
      .collect();
  },
});

// --------------------------------------------------
// Get resources for a station
// --------------------------------------------------

export const getStationResources = query({
  args: {
    stationId: v.id("reliefStations"),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("resources")
      .withIndex("by_stationId", (q) =>
        q.eq("stationId", args.stationId)
      )
      .collect();
  },
});

// --------------------------------------------------
// Get verified relief stations
// --------------------------------------------------

export const getApprovedReliefStations = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("reliefStations")
      .filter((q) =>
        q.eq(q.field("verificationStatus"), "verified")
      )
      .collect();
  },
});