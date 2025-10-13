import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  groups: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
  }),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    isActive: v.optional(v.boolean()), // Track which group is currently active
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_user_and_group", ["userId", "groupId"]),
  
  giftItems: defineTable({
    title: v.string(),
    link: v.optional(v.string()),
    // Legacy field for backward compatibility
    purchased: v.optional(v.boolean()),
    // New status system
    status: v.optional(v.union(v.literal("up_for_grabs"), v.literal("claimed"), v.literal("purchased"))),
    statusChangedBy: v.optional(v.id("users")),
    ownerId: v.id("users"),
    // Starting fresh: groupId required
    groupId: v.id("groups"),
  })
    .index("by_owner", ["ownerId"])
    .index("by_group", ["groupId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
