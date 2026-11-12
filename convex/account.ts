import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const leaveGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to leave a group");
    }

    // Check if user has more than one family
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length <= 1) {
      throw new Error("Cannot leave your only family");
    }

    // Find and remove the membership
    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user_and_group", (q) => q.eq("userId", userId).eq("groupId", args.groupId))
      .first();

    if (!targetMembership) {
      throw new Error("Not a member of this group");
    }

    // Leaving a group permanently deletes that user's lists and gifts in it.
    const userWishlists = await ctx.db
      .query("wishlists")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    for (const wishlist of userWishlists) {
      const gifts = await ctx.db
        .query("giftItems")
        .withIndex("by_wishlist", (q) => q.eq("wishlistId", wishlist._id))
        .collect();

      await Promise.all(gifts.map((gift) => ctx.db.delete(gift._id)));
      await ctx.db.delete(wishlist._id);
    }

    await ctx.db.delete(targetMembership._id);
  },
});

export const updateUserName = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update name");
    }

    await ctx.db.patch(userId, { name: args.name });
  },
});
