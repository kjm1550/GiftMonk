import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createGroup = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create a group");
    }

    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      createdBy: userId,
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      // membership is stateless; we no longer set an active flag
    });

    return groupId;
  },
});

export const joinGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to join a group");
    }

    // Check if user is already in this group
    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user_and_group", (q) => q.eq("userId", userId).eq("groupId", args.groupId))
      .first();

    if (existingMembership) {
      throw new Error("Already a member of this group");
    }

    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId,
      // membership is stateless
    });
  },
});

export const getUserGroup = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Return the first group the user belongs to (client should supply explicit groupId for actions)
    const firstMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!firstMembership) return null;
    return await ctx.db.get(firstMembership.groupId);
  },
});

export const getGroupMembers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership) {
      return [];
    }

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          _id: m.userId,
          email: user?.email || "Unknown",
          name: user?.name || user?.email || "Unknown",
        };
      })
    );

    return members;
  },
});

export const getUserGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        return {
          ...group,
          membershipId: membership._id,
        };
      })
    );

    return groups.filter(g => g !== null);
  },
});

export const getAllGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("groups").collect();
  },
});
