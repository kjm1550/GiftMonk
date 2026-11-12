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
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_user_and_group", ["userId", "groupId"]),

  wishlists: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_created_by", ["createdBy"]),

  giftItems: defineTable({
    title: v.string(),
    link: v.optional(v.string()),
    status: v.union(
      v.literal("up_for_grabs"),
      v.literal("claimed"),
      v.literal("purchased"),
    ),
    statusChangedBy: v.optional(v.id("users")),
    groupId: v.id("groups"),
    wishlistId: v.id("wishlists"),
  }).index("by_wishlist", ["wishlistId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
