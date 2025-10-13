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

    // Set this as the active group if it's the user's first group
    const existingMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      isActive: existingMemberships.length === 0, // First group is active by default
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

    // Check if user has any groups (to determine if this should be active)
    const userMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId,
      isActive: userMemberships.length === 0, // First group is active by default
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

    // Get the active group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!membership) {
      // If no active group, get the first group
      const firstMembership = await ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!firstMembership) {
        return null;
      }

      // Return first group (will be set as active by a separate mutation)
      const group = await ctx.db.get(firstMembership.groupId);
      return group;
    }

    const group = await ctx.db.get(membership.groupId);
    return group;
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
          isActive: membership.isActive || false,
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
