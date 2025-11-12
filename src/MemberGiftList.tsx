import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface MemberGiftListProps {
  memberId: string;
  groupId: string;
  onBack: () => void;
}

export function MemberGiftList({ memberId, groupId, onBack }: MemberGiftListProps) {
  // const memberGifts = useQuery(api.gifts.getGroupMemberGifts, { memberId: memberId as any });
  const memberGifts = useQuery(api.gifts.getUserGiftItemsBasedOnGroup, { memberId: memberId as any, groupId: groupId as any });
  const groupMembers = useQuery(api.groups.getGroupMembers);
  const updateGiftStatus = useMutation(api.gifts.updateGiftStatus);

  const member = groupMembers?.find((m) => m._id === memberId);

  const handleStatusChange = async (giftId: string, newStatus: "up_for_grabs" | "claimed" | "purchased") => {
    try {
      await updateGiftStatus({ giftId: giftId as any, status: newStatus });
      toast.success("Gift status updated!");
    } catch {
      toast.error("Failed to update gift status");
    }
  };

  if (!member) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Member not found.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "purchased": return "bg-green-50 border-green-200";
      case "claimed": return "bg-yellow-50 border-yellow-200";
      default: return "border-gray-200 hover:bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "purchased": return "Purchased";
      case "claimed": return "Claimed";
      default: return "Up for Grabs";
    }
  };

  const getNextStatus = (status: string) => {
    switch (status) {
      case "up_for_grabs": return "claimed";
      case "claimed": return "purchased";
      case "purchased": return "up_for_grabs";
      default: return "claimed";
    }
  };

  const getNextStatusText = (status: string) => {
    switch (status) {
      case "up_for_grabs": return "Claim";
      case "claimed": return "Mark Purchased";
      case "purchased": return "Reset";
      default: return "Claim";
    }
  };

  const getButtonColor = (status: string) => {
    switch (status) {
      case "purchased": return "bg-green-600 text-white hover:bg-green-700";
      case "claimed": return "bg-yellow-600 text-white hover:bg-yellow-700";
      default: return "bg-blue-600 text-white hover:bg-blue-700";
    }
  };

  const getTitleColor = (status: string) => {
    switch (status) {
      case "purchased": return "text-green-800 line-through";
      case "claimed": return "text-yellow-800";
      default: return "text-gray-900";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">{member.name}'s Gift List</h2>
          <p className="text-gray-500">{member.email}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-primary hover:bg-primary hover:text-white rounded-md transition-colors border border-primary"
        >
          ← Back to Group
        </button>
      </div>

      <div className="space-y-3">
        {memberGifts?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {member.name} hasn't added any gifts to their list yet.
          </p>
        ) : (
          memberGifts?.map((gift) => (
            <div
              key={gift._id}
              className={`p-4 border rounded-lg transition-colors ${getStatusColor(gift.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className={`font-medium ${getTitleColor(gift.status)}`}>
                    {gift.title}
                  </h3>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {getStatusText(gift.status)} {gift.status !== "up_for_grabs" && `by  ${gift.statusChangedByName}`}
                  </p>
                </div>
                <button
                  onClick={() => void handleStatusChange(gift._id, getNextStatus(gift.status) as any)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${getButtonColor(gift.status)}`}
                >
                  {getNextStatusText(gift.status)}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
