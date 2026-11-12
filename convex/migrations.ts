import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const BATCH_SIZE = 50;

/**
 * One-off migration for the wishlist rollout.
 *
 * For every legacy gift item without a `wishlistId`, create (or reuse) a
 * default wishlist for that gift's owner in its group and attach the gift.
 *
 * Call repeatedly with the returned `continueCursor` until `isDone` is true:
 *   npx convex run migrations:backfillWishlists
 *   npx convex run migrations:backfillWishlists '{"cursor":"<cursor>"}'
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

    for (const gift of result.page) {
      if (gift.wishlistId) {
        continue;
      }

      const cacheKey = `${gift.groupId}:${gift.ownerId}`;
      let wishlistId = wishlistCache.get(cacheKey);

      if (!wishlistId) {
        const existing = await ctx.db
          .query("wishlists")
          .withIndex("by_group", (q) => q.eq("groupId", gift.groupId))
          .filter((q) => q.eq(q.field("recipientUserId"), gift.ownerId))
          .first();

        if (existing) {
          wishlistId = existing._id;
        } else {
          const owner = await ctx.db.get(gift.ownerId);
          const ownerName = owner?.name ?? owner?.email;

          wishlistId = await ctx.db.insert("wishlists", {
            groupId: gift.groupId,
            name: ownerName ? `${ownerName}'s Wishlist` : "My Wishlist",
            recipientUserId: gift.ownerId,
            recipientName: ownerName,
            managerIds: [gift.ownerId],
            createdBy: gift.ownerId,
          });
        }

        wishlistCache.set(cacheKey, wishlistId);
      }

      await ctx.db.patch(gift._id, { wishlistId });
    }

    return {
      processed: result.page.length,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
