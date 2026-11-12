import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

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
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sortedLists = [...myLists].sort(
    (a, b) => a._creationTime - b._creationTime,
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">My Gift Lists</h2>
            <p className="mt-1 text-sm text-gray-500">
              These lists are shared with your active group. Only you can add
              gifts to them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setNewListName("");
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors shrink-0"
          >
            {showCreateForm ? "Cancel" : "New List"}
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={(e) => void handleCreateList(e)}
            className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <label
              htmlFor="new-list-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              List name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="new-list-name"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. John's List"
                className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                required
              />
              <button
                type="submit"
                disabled={!newListName.trim()}
                className="px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                Create List
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              This list is added to the active group automatically.
            </p>
          </form>
        )}
      </div>

      {sortedLists.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <p className="text-gray-500">
            You don't have any gift lists in this group yet.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
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
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {isRenaming ? (
            <form
              onSubmit={(e) => void handleRename(e)}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-2 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <h3 className="break-words text-xl font-semibold text-gray-900">
              {wishlist.name}
            </h3>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Shared with your group. Only you can add gifts.
          </p>
        </div>

        {!isRenaming && wishlist.canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {wishlist.canAddGifts && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
              >
                {showAddForm ? "Cancel" : "Add Gift"}
              </button>
            )}
            <button
              type="button"
              onClick={startRenaming}
              className="px-3 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {showAddForm && wishlist.canAddGifts && (
        <form
          onSubmit={(e) => void handleAddGift(e)}
          className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <input
            type="text"
            placeholder="Gift title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            required
          />
          <input
            type="url"
            placeholder="Link (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Add to List
          </button>
        </form>
      )}

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
                    className="text-primary hover:underline text-sm"
                  >
                    View Link
                  </a>
                )}
              </div>
              {wishlist.canManage && (
                <button
                  type="button"
                  onClick={() => void handleDeleteGift(gift._id)}
                  className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            Delete <span className="font-semibold">{wishlist.name}</span> and
            all of its gifts? This cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDeleteList()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete List
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
