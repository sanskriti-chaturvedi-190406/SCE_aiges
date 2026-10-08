import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const location = v.object({
  latitude: v.number(),
  longitude: v.number(),
  address: v.optional(v.string()),
  accuracy: v.optional(v.number()),
});

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.union(
      v.literal("victim"),
      v.literal("volunteer"),
      v.literal("stationOp"),
      v.literal("shelterOp"),
      v.literal("admin")
    ),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  volunteers: defineTable({
    userId: v.id("users"),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    availability: v.union(
      v.literal("available"),
      v.literal("unavailable")
    ),
    capabilities: v.array(v.string()),
    location: location,
    lastActiveAt: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  reliefStations: defineTable({
    name: v.string(),
    operatorId: v.optional(v.id("users")),
    location: location,
    status: v.string(),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    contactPhone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_operatorId", ["operatorId"]),

  resources: defineTable({
    stationId: v.id("reliefStations"),
    type: v.string(),
    quantity: v.number(),
    unit: v.string(),
    updatedAt: v.number(),
  }).index("by_stationId", ["stationId"]),

  shelters: defineTable({
    sheltername: v.string(),
    operatorName: v.string(),
    shelterType: v.string(),
    operatorId: v.optional(v.id("users")),
    contactPhone: v.string(),
    alternateContact: v.optional(v.string()),
    email: v.string(),
    location: location,
    capacity: v.number(),
    currentOccupancy: v.number(),
    status: v.string(),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    specialAssistance: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_operatorId", ["operatorId"]),

  requests: defineTable({
    victimId: v.id("users"),
    volunteerId: v.optional(v.id("users")),
    type: v.string(),
    description: v.optional(v.string()),
    peopleCount: v.number(),
    location: location,
    status: v.string(),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_victimId", ["victimId"])
    .index("by_volunteerId", ["volunteerId"]),
});