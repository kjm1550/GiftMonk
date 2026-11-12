import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { CardSkeleton } from "./Skeleton";
import { BottomSheet } from "./BottomSheet";

interface MyGiftListProps {
  groupId: Id<"groups">;
}

export function MyGiftList({ groupId }: MyGiftListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");

  const myLists = useQuery(api.wishlists.getMyWishlists, { groupId });
  const createWishlist = useMutation(api.wishlists.createWishlist);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = newListName.trim();
    if (!name) return;

    try {
      await createWishlist({ groupId, name });
      setNewListName("");
      setShowCreateForm(false);
      toast.success("Gift list created.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create gift list.");
    }
  };

  if (myLists === undefined) {
    return <CardSkeleton />;
  }

  const sortedLists = [...myLists].sort(
    (a, b) => a._creationTime - b._creationTime,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary sm:text-2xl">
              My Gift Lists
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              These lists are shared with your active group. Only you can add
              gifts to them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewListName("");
              setShowCreateForm(true);
            }}
            className="min-h-11 w-full shrink-0 rounded-md bg-primary px-4 py-2 text-center text-white transition-colors hover:bg-primary-hover sm:w-auto"
          >
            New List
          </button>
        </div>
      </div>

      {sortedLists.length === 0 ? (
        <div className="rounded-lg border bg-white p-4 text-center shadow-sm sm:p-6">
          <p className="text-gray-500">
            You don't have any gift lists in this group yet.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="mt-4 min-h-11 w-full rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover sm:w-auto"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLists.map((list) => (
            <MyWishlistCard key={list._id} wishlistId={list._id} />
          ))}
        </div>
      )}

      <BottomSheet
        open={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setNewListName("");
        }}
        title="New gift list"
      >
        <form onSubmit={(e) => void handleCreateList(e)} className="space-y-3">
          <div>
            <label
              htmlFor="new-list-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              List name
            </label>
            <input
              id="new-list-name"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. John's List"
              className="w-full rounded border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={!newListName.trim()}
            className="min-h-11 w-full rounded-md bg-primary px-4 py-3 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create List
          </button>
          <p className="text-xs text-gray-500">
            This list is added to the active group automatically.
          </p>
        </form>
      </BottomSheet>
    </div>
  );
}

function MyWishlistCard({ wishlistId }: { wishlistId: Id<"wishlists"> }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const wishlist = useQuery(api.wishlists.getWishlist, { wishlistId });
  const addGiftItem = useMutation(api.wishlists.addGiftItemToWishlist);
  const deleteGiftItem = useMutation(api.wishlists.deleteWishlistGiftItem);
  const updateWishlist = useMutation(api.wishlists.updateWishlist);
  const deleteWishlist = useMutation(api.wishlists.deleteWishlist);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    try {
      await addGiftItem({
        wishlistId,
        title: trimmedTitle,
        link: link.trim() || undefined,
      });
      setTitle("");
      setLink("");
      setShowAddForm(false);
      toast.success("Gift added to the list.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add gift.");
    }
  };

  const handleDeleteGift = async (giftId: Id<"giftItems">) => {
    try {
      await deleteGiftItem({ giftId });
      toast.success("Gift removed from the list.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove gift.");
    }
  };

  const startRenaming = () => {
    if (!wishlist) return;
    setRenameValue(wishlist.name);
    setIsRenaming(true);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = renameValue.trim();
    if (!name) return;

    try {
      await updateWishlist({ wishlistId, name });
      setIsRenaming(false);
      toast.success("Gift list renamed.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to rename gift list.");
    }
  };

  const handleDeleteList = async () => {
    try {
      await deleteWishlist({ wishlistId });
      setShowDeleteConfirm(false);
      toast.success("Gift list and its gifts were deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete gift list.");
    }
  };

  if (wishlist === undefined) {
    return <CardSkeleton rows={2} />;
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-xl font-semibold text-gray-900">
            {wishlist.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Shared with your group. Only you can add gifts.
          </p>
        </div>

        {wishlist.canManage && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {wishlist.canAddGifts && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="col-span-2 min-h-11 rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover sm:col-auto"
              >
                Add Gift
              </button>
            )}
            <button
              type="button"
              onClick={startRenaming}
              className="min-h-11 rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-11 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {wishlist.gifts.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No gifts in this list yet.
          </p>
        ) : (
          wishlist.gifts.map((gift) => (
            <div
              key={gift._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <h4 className="break-words font-medium text-gray-900">
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
              </div>
              {wishlist.canManage && (
                <button
                  type="button"
                  onClick={() => void handleDeleteGift(gift._id)}
                  className="min-h-11 shrink-0 rounded-md px-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 active:bg-red-100"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <BottomSheet
        open={isRenaming}
        onClose={() => setIsRenaming(false)}
        title="Rename gift list"
      >
        <form onSubmit={(e) => void handleRename(e)} className="space-y-3">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full rounded border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            autoFocus
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              className="min-h-11 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!renameValue.trim()}
              className="min-h-11 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet
        open={showAddForm && wishlist.canAddGifts}
        onClose={() => {
          setShowAddForm(false);
          setTitle("");
          setLink("");
        }}
        title="Add a gift"
      >
        <form onSubmit={(e) => void handleAddGift(e)} className="space-y-3">
          <input
            type="text"
            placeholder="Gift title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            autoFocus
            required
          />
          <input
            type="url"
            inputMode="url"
            autoCapitalize="none"
            placeholder="Link (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="min-h-11 w-full rounded-md bg-primary px-4 py-3 text-white transition-colors hover:bg-primary-hover"
          >
            Add to List
          </button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete gift list?"
      >
        <p className="text-sm text-red-800">
          Delete <span className="font-semibold">{wishlist.name}</span> and all
          of its gifts? This cannot be undone.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="min-h-11 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteList()}
            className="min-h-11 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete List
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
