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
      <div className="flex justify-center rounded-lg border bg-white p-4 shadow-sm sm:p-6">
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
    <div>
      <h2 className="mb-4 text-2xl font-bold text-primary sm:mb-6">
        Group's Gift Lists
      </h2>

      {members.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No other members in this group yet.
          </p>
        </div>
      ) : visibleLists.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No gift lists have been created yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
