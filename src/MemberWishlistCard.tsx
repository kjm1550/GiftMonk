import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

type GiftStatus = "up_for_grabs" | "claimed" | "purchased";

const STATUS_OPTIONS: {
  value: GiftStatus;
  label: string;
  chip: string;
  dot: string;
  active: string;
}[] = [
  {
    value: "up_for_grabs",
    label: "Up for Grabs",
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    active: "bg-blue-600 text-white",
  },
  {
    value: "claimed",
    label: "Claimed",
    chip: "border-yellow-200 bg-yellow-50 text-yellow-800",
    dot: "bg-yellow-500",
    active: "bg-yellow-600 text-white",
  },
  {
    value: "purchased",
    label: "Purchased",
    chip: "border-green-200 bg-green-50 text-green-800",
    dot: "bg-green-500",
    active: "bg-green-600 text-white",
  },
];

function getStatusMeta(status: GiftStatus) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status) ??
    STATUS_OPTIONS[0]
  );
}

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
    return (
      <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
            const meta = getStatusMeta(status);
            const isUpdating = updatingGiftId === gift._id;

            return (
              <div
                key={gift._id}
                className={`rounded-lg border p-3 transition-colors sm:p-4 ${getStatusBackground(status)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className={`min-w-0 break-words font-medium ${getTitleColor(status)}`}
                  >
                    {gift.title}
                  </h4>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.chip}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                    />
                    {meta.label}
                  </span>
                </div>

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

                {status !== "up_for_grabs" && gift.statusChangedByName && (
                  <p className="text-xs text-gray-500">
                    {meta.label} by {gift.statusChangedByName}
                  </p>
                )}

                <div
                  role="group"
                  aria-label={`Update status for ${gift.title}`}
                  className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-gray-200 bg-white/70 p-1"
                >
                  {STATUS_OPTIONS.map((option) => {
                    const isActive = status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          void handleStatusChange(gift._id, option.value)
                        }
                        disabled={isActive || isUpdating}
                        aria-pressed={isActive}
                        className={`min-h-11 rounded-md px-1 text-[11px] font-medium leading-tight transition-colors disabled:cursor-default sm:text-xs ${
                          isActive
                            ? option.active
                            : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                        } ${isUpdating ? "opacity-60" : ""}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
