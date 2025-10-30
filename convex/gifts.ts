import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addGiftItem = mutation({
  args: {
    title: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add gift items");
    }

    // Get user's active group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!membership) {
      throw new Error("Must have an active group to add gift items");
    }

    return await ctx.db.insert("giftItems", {
      title: args.title,
      link: args.link,
      status: "up_for_grabs",
      ownerId: userId,
      groupId: membership.groupId,
    });
  },
});

export const getMyGiftList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const items = await ctx.db
      .query("giftItems")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    // Group items by group and include group names
    const groupIds = [...new Set(items.map(item => item.groupId).filter(Boolean))];
    const groups = await Promise.all(
      groupIds.map(async (groupId) => {
        const group: any = await ctx.db.get(groupId as any);
        return { id: groupId, name: group?.name || "Unknown Group" };
      })
    );

    const groupMap = Object.fromEntries(groups.map(f => [f.id, f.name]));

    // Don't show status for own items, but include group info
    return items.map((item) => ({
      _id: item._id,
      title: item.title,
      link: item.link,
      ownerId: item.ownerId,
      groupId: item.groupId,
      groupName: item.groupId ? groupMap[item.groupId] ?? "Unknown Group" : undefined,
    }));
  },
});

// need to get the user name of the user who changed the status
export const getUserDisplayName = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.name ?? "Unknown User";
  },
});

export const getUserGiftItemsBasedOnGroup = query({
  args: {
    memberId: v.id("users"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to see gift items");
    }

    // Don't allow viewing own gift list with status
    if (userId === args.memberId) {
      return [];
    }

    // Verify the current user is a member of the specified group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .first();

    if (!membership) {
      throw new Error("You must be a member of this group to view gift lists.");
    }

    // Fetch gift items for the target member within the specified group
    const items = await ctx.db
      .query("giftItems")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.memberId))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    // Convert legacy purchased field to status for display
    return Promise.all(items.map(async (item) => {
      let statusChangedByName: string | undefined;
      if (item.statusChangedBy) {
        const user = await ctx.db.get(item.statusChangedBy);
        statusChangedByName = user?.name ?? user?.email ?? "Unknown User";
      }
      return {
        ...item,
        status: item.status || (item.purchased ? "purchased" : "up_for_grabs"),
        statusChangedByName,
      };
    }));
    },
  });

export const getGroupMemberGifts = query({
  args: {
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Don't allow viewing own gift list with status
    if (args.memberId === userId) {
      return [];
    }

    // Verify both users are in the same group
    const userMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.memberId))
      .first();

    if (!userMembership || !targetMembership || userMembership.groupId !== targetMembership.groupId) {
      throw new Error("Can only view gift lists of group members");
    }

    const items = await ctx.db
      .query("giftItems")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.memberId))
      .collect();

    // Convert legacy purchased field to status for display
    return items.map((item) => ({
      ...item,
      status: item.status || (item.purchased ? "purchased" : "up_for_grabs"),
    }));
  },
});

export const updateGiftStatus = mutation({
  args: {
    giftId: v.id("giftItems"),
    status: v.union(v.literal("up_for_grabs"), v.literal("claimed"), v.literal("purchased")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update gift status");
    }

    const gift = await ctx.db.get(args.giftId);
    if (!gift) {
      throw new Error("Gift item not found");
    }

    // Don't allow updating own items
    if (gift.ownerId === userId) {
      throw new Error("Cannot update status of your own items");
    }

    // Verify user is in the same group
    const userMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userMembership || userMembership.groupId !== gift.groupId) {
      throw new Error("Can only update status for group members' items");
    }

    await ctx.db.patch(args.giftId, {
      status: args.status,
      statusChangedBy: userId,
    });
  },
});

export const deleteGiftItem = mutation({
  args: {
    giftId: v.id("giftItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to delete gift items");
    }

    const gift = await ctx.db.get(args.giftId);
    if (!gift) {
      throw new Error("Gift item not found");
    }

    // Only allow deleting own items
    if (gift.ownerId !== userId) {
      throw new Error("Can only delete your own gift items");
    }

    await ctx.db.delete(args.giftId);
  },
});
