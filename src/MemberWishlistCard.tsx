import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { CardSkeleton } from "./Skeleton";

type GiftStatus = "up_for_grabs" | "claimed" | "purchased";

export function MemberWishlistCard({
  wishlistId,
  ownerEmail,
}: {
  wishlistId: Id<"wishlists">;
  ownerEmail: string;
}) {
  const [updatingGiftId, setUpdatingGiftId] = useState<Id<"giftItems"> | null>(
    null,
  );
  const wishlist = useQuery(api.wishlists.getWishlist, { wishlistId });
  const updateGiftStatus = useMutation(api.wishlists.updateWishlistGiftStatus);

  const handleStatusChange = async (
    giftId: Id<"giftItems">,
    newStatus: GiftStatus,
  ) => {
    setUpdatingGiftId(giftId);
    try {
      await updateGiftStatus({ giftId, status: newStatus });
      toast.success("Gift status updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update gift status.");
    } finally {
      setUpdatingGiftId(null);
    }
  };

  if (wishlist === undefined) {
    return <CardSkeleton rows={2} />;
  }

  const getStatusBackground = (status: GiftStatus) => {
    switch (status) {
      case "purchased":
        return "bg-green-50 border-green-200";
      case "claimed":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "border-gray-200 hover:bg-gray-50";
    }
  };

  const getTitleColor = (status: GiftStatus) => {
    switch (status) {
      case "purchased":
        return "text-green-800 line-through";
      case "claimed":
        return "text-yellow-800";
      default:
        return "text-gray-900";
    }
  };

  const getStatusText = (status: GiftStatus) => {
    switch (status) {
      case "purchased":
        return "Purchased";
      case "claimed":
        return "Claimed";
      default:
        return "Up for Grabs";
    }
  };

  const getNextStatus = (status: GiftStatus): GiftStatus => {
    switch (status) {
      case "up_for_grabs":
        return "claimed";
      case "claimed":
        return "purchased";
      case "purchased":
        return "up_for_grabs";
    }
  };

  const getNextStatusText = (status: GiftStatus) => {
    switch (status) {
      case "up_for_grabs":
        return "Claim";
      case "claimed":
        return "Mark Purchased";
      case "purchased":
        return "Reset";
    }
  };

  const getButtonColor = (status: GiftStatus) => {
    switch (status) {
      case "purchased":
        return "bg-green-600 text-white hover:bg-green-700";
      case "claimed":
        return "bg-yellow-600 text-white hover:bg-yellow-700";
      default:
        return "bg-blue-600 text-white hover:bg-blue-700";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="break-words text-lg font-semibold text-gray-900">
        {wishlist.name}
      </h3>
      <p className="break-all text-sm text-gray-500">{ownerEmail}</p>

      <div className="mt-3 space-y-3">
        {wishlist.gifts.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No gifts in this list yet.
          </p>
        ) : (
          wishlist.gifts.map((gift) => {
            const status = gift.status ?? "up_for_grabs";
            const isUpdating = updatingGiftId === gift._id;

            return (
              <div
                key={gift._id}
                className={`rounded-lg border p-3 transition-colors sm:p-4 ${getStatusBackground(status)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4
                      className={`break-words font-medium ${getTitleColor(status)}`}
                    >
                      {gift.title}
                    </h4>

                    {gift.link && (
                      <a
                        href={gift.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
                      >
                        View Link
                      </a>
                    )}

                    <p className="text-xs text-gray-500">
                      Status: {getStatusText(status)}
                      {status !== "up_for_grabs" &&
                        gift.statusChangedByName &&
                        ` by ${gift.statusChangedByName}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleStatusChange(gift._id, getNextStatus(status))
                    }
                    disabled={isUpdating}
                    aria-busy={isUpdating}
                    className={`min-h-11 shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${getButtonColor(status)}`}
                  >
                    {isUpdating ? "Updating..." : getNextStatusText(status)}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
