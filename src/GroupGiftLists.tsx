import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { MemberWishlistCard } from "./MemberWishlistCard";

interface GroupGiftListsProps {
  groupId: Id<"groups">;
}

export function GroupGiftLists({ groupId }: GroupGiftListsProps) {
  const groupsWithMembers = useQuery(api.groupMembers.getGroupMembersGrouped);
  const groupWishlists = useQuery(api.wishlists.getGroupWishlists, {
    groupId,
  });

  if (groupsWithMembers === undefined || groupWishlists === undefined) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeGroup = groupsWithMembers.find(
    (group) => group.group._id === groupId,
  );
  const members = activeGroup?.members ?? [];
  const membersById = new Map(members.map((member) => [member._id, member]));

  const visibleLists = groupWishlists.filter((list) =>
    membersById.has(list.createdBy),
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">
        Group's Gift Lists
      </h2>

      {members.length === 0 ? (
        <p className="text-gray-500 text-sm pl-4">
          No other members in this group yet.
        </p>
      ) : visibleLists.length === 0 ? (
        <p className="text-gray-500 text-sm pl-4">
          No gift lists have been created yet.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleLists.map((list) => (
            <MemberWishlistCard
              key={list._id}
              wishlistId={list._id}
              ownerEmail={membersById.get(list.createdBy)?.email ?? "Unknown"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
