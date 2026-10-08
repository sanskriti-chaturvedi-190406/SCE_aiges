import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const location = v.object({
  latitude: v.number(),
  longitude: v.number(),
  address: v.optional(v.string()),
  accuracy: v.optional(v.number()),
});

// Get the currently authenticated Aegis user
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
// Register a shelter
// --------------------------------------------------

export const registerShelter = mutation({
  args: {
    sheltername: v.string(),
    operatorName: v.string(),
    shelterType: v.string(),
    contactPhone: v.string(),
    alternateContact: v.optional(v.string()),
    email: v.string(),
    location,
    capacity: v.number(),
    status: v.string(),
    specialAssistance: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (user.role !== "shelterOp") {
      throw new Error("Only shelter operators can register a shelter");
    }

    if (args.capacity < 0) {
      throw new Error("Capacity cannot be negative");
    }

    const shelterId = await ctx.db.insert("shelters", {
      sheltername: args.sheltername,
      operatorName: args.operatorName,
      shelterType: args.shelterType,
      operatorId: user._id,
      contactPhone: args.contactPhone,
      alternateContact: args.alternateContact,
      email: args.email,
      location: args.location,
      capacity: args.capacity,
      currentOccupancy: 0,
      status: args.status,
      verificationStatus: "pending",
      specialAssistance: args.specialAssistance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("[Aegis] Shelter registered:", shelterId);

    return shelterId;
  },
});

// --------------------------------------------------
// Check people into a shelter
// --------------------------------------------------

export const checkInPeople = mutation({
  args: {
    shelterId: v.id("shelters"),
    peopleCount: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const shelter = await ctx.db.get(args.shelterId);

    if (!shelter) {
      throw new Error("Shelter not found");
    }

    if (
      user.role !== "admin" &&
      shelter.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this shelter");
    }

    if (args.peopleCount <= 0) {
      throw new Error("People count must be greater than zero");
    }

    const newOccupancy =
      shelter.currentOccupancy + args.peopleCount;

    if (newOccupancy > shelter.capacity) {
      throw new Error("Shelter capacity exceeded");
    }

    await ctx.db.patch(args.shelterId, {
      currentOccupancy: newOccupancy,
      updatedAt: Date.now(),
    });

    return newOccupancy;
  },
});

// --------------------------------------------------
// Check people out of a shelter
// --------------------------------------------------

export const checkOutPeople = mutation({
  args: {
    shelterId: v.id("shelters"),
    peopleCount: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const shelter = await ctx.db.get(args.shelterId);

    if (!shelter) {
      throw new Error("Shelter not found");
    }

    if (
      user.role !== "admin" &&
      shelter.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this shelter");
    }

    if (args.peopleCount <= 0) {
      throw new Error("People count must be greater than zero");
    }

    const newOccupancy =
      shelter.currentOccupancy - args.peopleCount;

    if (newOccupancy < 0) {
      throw new Error(
        "Checkout count cannot exceed current occupancy"
      );
    }

    await ctx.db.patch(args.shelterId, {
      currentOccupancy: newOccupancy,
      updatedAt: Date.now(),
    });

    return newOccupancy;
  },
});

// --------------------------------------------------
// Update shelter capacity
// --------------------------------------------------

export const updateShelterCapacity = mutation({
  args: {
    shelterId: v.id("shelters"),
    capacity: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const shelter = await ctx.db.get(args.shelterId);

    if (!shelter) {
      throw new Error("Shelter not found");
    }

    if (
      user.role !== "admin" &&
      shelter.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to modify this shelter");
    }

    if (args.capacity < shelter.currentOccupancy) {
      throw new Error(
        "Capacity cannot be lower than current occupancy"
      );
    }

    await ctx.db.patch(args.shelterId, {
      capacity: args.capacity,
      updatedAt: Date.now(),
    });

    return args.capacity;
  },
});

// --------------------------------------------------
// Update shelter status
// --------------------------------------------------

export const updateShelterStatus = mutation({
  args: {
    shelterId: v.id("shelters"),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const shelter = await ctx.db.get(args.shelterId);

    if (!shelter) {
      throw new Error("Shelter not found");
    }

    if (
      user.role !== "admin" &&
      shelter.operatorId !== user._id
    ) {
      throw new Error("You are not authorized to update this shelter");
    }

    await ctx.db.patch(args.shelterId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.shelterId;
  },
});

// --------------------------------------------------
// Admin: update shelter verification
// --------------------------------------------------

export const updateShelterVerificationStatus = mutation({
  args: {
    shelterId: v.id("shelters"),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    ),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (user.role !== "admin") {
      throw new Error(
        "Only admins can update verification status"
      );
    }

    const shelter = await ctx.db.get(args.shelterId);

    if (!shelter) {
      throw new Error("Shelter not found");
    }

    await ctx.db.patch(args.shelterId, {
      verificationStatus: args.verificationStatus,
      updatedAt: Date.now(),
    });

    return args.shelterId;
  },
});

// --------------------------------------------------
// Get shelter by ID
// --------------------------------------------------

export const getShelterById = query({
  args: {
    shelterId: v.id("shelters"),
  },

  handler: async (ctx, args) => {
    return await ctx.db.get(args.shelterId);
  },
});

// --------------------------------------------------
// Get shelters belonging to current operator
// --------------------------------------------------

export const getSheltersByOperator = query({
  args: {},

  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    return await ctx.db
      .query("shelters")
      .withIndex("by_operatorId", (q) =>
        q.eq("operatorId", user._id)
      )
      .collect();
  },
});

// --------------------------------------------------
// Get verified shelters
// --------------------------------------------------

export const listApprovedShelters = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("shelters")
      .filter((q) =>
        q.eq(q.field("verificationStatus"), "verified")
      )
      .collect();
  },
});
