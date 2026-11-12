import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const BATCH_SIZE = 50;

type LegacyGiftItem = Omit<Doc<"giftItems">, "wishlistId" | "status"> & {
  wishlistId?: Id<"wishlists">;
  status?: "up_for_grabs" | "claimed" | "purchased";
  ownerId?: Id<"users">;
  purchased?: boolean;
};

/**
 * Migration order:
 *   1. backfillWishlists
 *   2. normalizeWishlists
 *   3. normalizeGroupMembers
 *
 * Run each one repeatedly with its returned cursor until `isDone` is true.
 */
export const backfillWishlists = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("giftItems")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor ?? null });

    const wishlistCache = new Map<string, Id<"wishlists">>();

    for (const rawGift of result.page) {
      const gift = rawGift as LegacyGiftItem;
      let wishlistId = gift.wishlistId;

      if (!wishlistId) {
        const ownerId = gift.ownerId;
        if (!ownerId) {
          throw new Error(`Gift ${gift._id} has no wishlistId or ownerId`);
        }

        const cacheKey = `${gift.groupId}:${ownerId}`;
        wishlistId = wishlistCache.get(cacheKey);

        if (!wishlistId) {
          const existing = await ctx.db
            .query("wishlists")
            .withIndex("by_created_by", (q) => q.eq("createdBy", ownerId))
            .filter((q) => q.eq(q.field("groupId"), gift.groupId))
            .first();

          if (existing) {
            wishlistId = existing._id;
          } else {
            const owner = await ctx.db.get(ownerId);
            const ownerName = owner?.name ?? owner?.email;

            wishlistId = await ctx.db.insert("wishlists", {
              groupId: gift.groupId,
              name: ownerName ? `${ownerName}'s Wishlist` : "My Wishlist",
              createdBy: ownerId,
            });
          }

          wishlistCache.set(cacheKey, wishlistId);
        }
      }

      if (!wishlistId) {
        throw new Error(`Could not resolve wishlist for gift ${gift._id}`);
      }

      const status =
        gift.status ?? (gift.purchased ? "purchased" : "up_for_grabs");

      await ctx.db.replace(gift._id, {
        title: gift.title,
        ...(gift.link !== undefined ? { link: gift.link } : {}),
        status,
        ...(gift.statusChangedBy
          ? { statusChangedBy: gift.statusChangedBy }
          : {}),
        groupId: gift.groupId,
        wishlistId,
      });
    }

    return {
      processed: result.page.length,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const normalizeWishlists = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("wishlists")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor ?? null });

    for (const wishlist of result.page) {
      if (!wishlist.createdBy) {
        throw new Error(`Wishlist ${wishlist._id} has no createdBy`);
      }

      await ctx.db.replace(wishlist._id, {
        groupId: wishlist.groupId,
        name: wishlist.name,
        createdBy: wishlist.createdBy,
      });
    }

    return {
      processed: result.page.length,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const normalizeGroupMembers = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("groupMembers")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor ?? null });

    for (const member of result.page) {
      await ctx.db.replace(member._id, {
        groupId: member.groupId,
        userId: member.userId,
      });
    }

    return {
      processed: result.page.length,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
