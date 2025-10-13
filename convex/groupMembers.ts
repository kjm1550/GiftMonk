import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getGroupMembersGrouped = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all groups the user is part of
    const userMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groupsWithMembers = await Promise.all(
      userMemberships.map(async (userMembership) => {
        const group = await ctx.db.get(userMembership.groupId);
        
        // Get all members of this group
        const memberships = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", userMembership.groupId))
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

        // Filter out the current user
        const otherMembers = members.filter(member => member._id !== userId);

        return {
          group: {
            _id: group?._id,
            name: group?.name || "Unknown Group",
            isActive: userMembership.isActive || false,
          },
          members: otherMembers,
        };
      })
    );

    return groupsWithMembers;
  },
});
