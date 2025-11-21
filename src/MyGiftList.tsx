import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function MyGiftList() {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const myGifts = useQuery(api.gifts.getMyGiftList);
  const userGroups = useQuery(api.groups.getUserGroups);
  const addGiftItem = useMutation(api.gifts.addGiftItem);
  const deleteGiftItem = useMutation(api.gifts.deleteGiftItem);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!selectedGroupId) {
      toast.error("Select a group to add the gift to");
      return;
    }

    try {
      await addGiftItem({
        title: title.trim(),
        link: link.trim() || undefined,
        groupId: selectedGroupId as any,
      });
      setTitle("");
      setLink("");
      setShowAddForm(false);
      toast.success("Gift added to your list!");
    } catch {
      toast.error("Failed to add gift");
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    try {
      await deleteGiftItem({ giftId: giftId as any });
      toast.success("Gift removed from your list");
    } catch {
      toast.error("Failed to remove gift");
    }
  };

  // Group gifts by group
  const giftsByGroup = myGifts?.reduce((acc, gift) => {
    const groupName = gift.groupName || "Unknown Group";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(gift);
    return acc;
  }, {} as Record<string, typeof myGifts>) || {};

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">My Gift List</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          {showAddForm ? "Cancel" : "Add Gift"}
        </button>
      </div>

      {showAddForm && (
  <form onSubmit={(e) => void handleAddGift(e)} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
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
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            >
              <option value="">Select group...</option>
              {userGroups?.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              Add to List
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
  {Object.keys(giftsByGroup).length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No gifts in your list yet. Add some items you'd like to receive!
          </p>
        ) : (
          Object.entries(giftsByGroup).map(([groupName, gifts]) => (
            <div key={groupName} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                {groupName}
              </h3>
              <div className="space-y-3">
                {gifts.map((gift) => (
                  <div
                    key={gift._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{gift.title}</h4>
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
                    <button
                      onClick={() => void handleDeleteGift(gift._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
