import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

type Ctx = QueryCtx | MutationCtx;

async function requireUserId(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Must be logged in");
  }
  return userId;
}

async function requireGroupMembership(
  ctx: Ctx,
  userId: Id<"users">,
  groupId: Id<"groups">,
) {
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_user_and_group", (q) =>
      q.eq("userId", userId).eq("groupId", groupId),
    )
    .first();

  if (!membership) {
    throw new Error("You must be a member of this group");
  }
}

async function getWishlistOrThrow(
  ctx: Ctx,
  wishlistId: Id<"wishlists">,
) {
  const wishlist = await ctx.db.get(wishlistId);
  if (!wishlist) {
    throw new Error("Gift list not found");
  }
  return wishlist;
}

async function getUserDisplayName(ctx: Ctx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  return user?.name ?? user?.email ?? "Unknown User";
}

function isOwner(wishlist: Doc<"wishlists">, userId: Id<"users">) {
  return wishlist.createdBy === userId;
}

export const getMyWishlists = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireGroupMembership(ctx, userId, args.groupId);

    const wishlists = await ctx.db
      .query("wishlists")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    return wishlists.sort((a, b) => a._creationTime - b._creationTime);
  },
});

export const getGroupWishlists = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireGroupMembership(ctx, userId, args.groupId);

    const wishlists = await ctx.db
      .query("wishlists")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    return wishlists.sort((a, b) => a._creationTime - b._creationTime);
  },
});

export const getWishlist = query({
  args: {
    wishlistId: v.id("wishlists"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const wishlist = await getWishlistOrThrow(ctx, args.wishlistId);
    await requireGroupMembership(ctx, userId, wishlist.groupId);

    const viewerIsOwner = isOwner(wishlist, userId);
    const gifts = await ctx.db
      .query("giftItems")
      .withIndex("by_wishlist", (q) => q.eq("wishlistId", args.wishlistId))
      .collect();

    const giftResults = await Promise.all(
      gifts.map(async (gift) => {
        const base = {
          _id: gift._id,
          title: gift.title,
          link: gift.link,
        };

        // The owner must never receive status information for their own list.
        if (viewerIsOwner) {
          return {
            ...base,
            status: undefined,
            statusChangedByName: undefined,
          };
        }

        let statusChangedByName: string | undefined;
        if (gift.statusChangedBy) {
          statusChangedByName = await getUserDisplayName(
            ctx,
            gift.statusChangedBy,
          );
        }

        return {
          ...base,
          status: gift.status,
          statusChangedByName,
        };
      }),
    );

    return {
      ...wishlist,
      ownerDisplayName: await getUserDisplayName(ctx, wishlist.createdBy),
      isOwner: viewerIsOwner,
      canManage: isOwner(wishlist, userId),
      canAddGifts: isOwner(wishlist, userId),
      gifts: giftResults,
    };
  },
});

export const createWishlist = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireGroupMembership(ctx, userId, args.groupId);

    const name = args.name.trim();
    if (!name) {
      throw new Error("List name is required");
    }

    return await ctx.db.insert("wishlists", {
      groupId: args.groupId,
      name,
      createdBy: userId,
    });
  },
});

export const updateWishlist = mutation({
  args: {
    wishlistId: v.id("wishlists"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const wishlist = await getWishlistOrThrow(ctx, args.wishlistId);

    if (!isOwner(wishlist, userId)) {
      throw new Error("Only the list creator can edit this list");
    }
    await requireGroupMembership(ctx, userId, wishlist.groupId);

    const name = args.name.trim();
    if (!name) {
      throw new Error("List name is required");
    }

    await ctx.db.patch(args.wishlistId, { name });
  },
});

export const deleteWishlist = mutation({
  args: {
    wishlistId: v.id("wishlists"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const wishlist = await getWishlistOrThrow(ctx, args.wishlistId);

    if (!isOwner(wishlist, userId)) {
      throw new Error("Only the list creator can delete this list");
    }
    await requireGroupMembership(ctx, userId, wishlist.groupId);

    const gifts = await ctx.db
      .query("giftItems")
      .withIndex("by_wishlist", (q) => q.eq("wishlistId", args.wishlistId))
      .collect();

    await Promise.all(gifts.map((gift) => ctx.db.delete(gift._id)));
    await ctx.db.delete(args.wishlistId);
  },
});

export const addGiftItemToWishlist = mutation({
  args: {
    wishlistId: v.id("wishlists"),
    title: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const wishlist = await getWishlistOrThrow(ctx, args.wishlistId);
    await requireGroupMembership(ctx, userId, wishlist.groupId);

    if (!isOwner(wishlist, userId)) {
      throw new Error("Only the list creator can add gifts to this list");
    }

    const title = args.title.trim();
    if (!title) {
      throw new Error("Gift title is required");
    }

    return await ctx.db.insert("giftItems", {
      title,
      link: args.link,
      status: "up_for_grabs",
      groupId: wishlist.groupId,
      wishlistId: args.wishlistId,
    });
  },
});

export const updateWishlistGiftStatus = mutation({
  args: {
    giftId: v.id("giftItems"),
    status: v.union(
      v.literal("up_for_grabs"),
      v.literal("claimed"),
      v.literal("purchased"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const gift = await ctx.db.get(args.giftId);
    if (!gift) {
      throw new Error("Gift item not found");
    }
    if (!gift.wishlistId) {
      throw new Error("Gift item does not belong to a wishlist");
    }

    const wishlist = await getWishlistOrThrow(ctx, gift.wishlistId);
    await requireGroupMembership(ctx, userId, wishlist.groupId);

    if (isOwner(wishlist, userId)) {
      throw new Error("The list owner cannot view or change gift statuses");
    }

    await ctx.db.patch(args.giftId, {
      status: args.status,
      statusChangedBy: userId,
    });
  },
});

export const deleteWishlistGiftItem = mutation({
  args: {
    giftId: v.id("giftItems"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const gift = await ctx.db.get(args.giftId);
    if (!gift) {
      throw new Error("Gift item not found");
    }
    if (!gift.wishlistId) {
      throw new Error("Gift item does not belong to a wishlist");
    }

    const wishlist = await getWishlistOrThrow(ctx, gift.wishlistId);
    await requireGroupMembership(ctx, userId, wishlist.groupId);

    if (!isOwner(wishlist, userId)) {
      throw new Error("Only the list creator can delete gifts from this list");
    }

    await ctx.db.delete(args.giftId);
  },
});
