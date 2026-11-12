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
    isActive: v.optional(v.boolean()), // Want to remove, it is not being used anymore
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_user_and_group", ["userId", "groupId"]),
  
  wishlists: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    // Set when the recipient has an account. Leave unset for child lists.
    recipientUserId: v.optional(v.id("users")),
    // Display name for recipients without an account (e.g. a child).
    recipientName: v.optional(v.string()),
    managerIds: v.array(v.id("users")),
    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_recipient", ["recipientUserId"])
    .index("by_created_by", ["createdBy"]),

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
    // New canonical owner key; optional during the migration window.
    wishlistId: v.optional(v.id("wishlists")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_group", ["groupId"])
    .index("by_wishlist", ["wishlistId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
