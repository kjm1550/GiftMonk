import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const setActiveGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to set active group");
    }

    // Deactivate all current families
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const membership of memberships) {
      await ctx.db.patch(membership._id, { isActive: false });
    }

    // Activate the selected family
    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user_and_group", (q) => q.eq("userId", userId).eq("groupId", args.groupId))
      .first();

    if (!targetMembership) {
      throw new Error("Not a member of this group");
    }

    await ctx.db.patch(targetMembership._id, { isActive: true });
  },
});

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

    const wasActive = targetMembership.isActive;
    await ctx.db.delete(targetMembership._id);

    // If this was the active group, set another group as active
    if (wasActive) {
      const remainingMemberships = await ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      if (remainingMemberships.length > 0) {
        await ctx.db.patch(remainingMemberships[0]._id, { isActive: true });
      }
    }
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
