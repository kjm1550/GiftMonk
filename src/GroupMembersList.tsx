import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface GroupMembersListProps {
  groupId: string;
  onSelectMember: (memberId: string) => void;
}

export function GroupMembersList({ groupId, onSelectMember }: GroupMembersListProps) {
  const groupsWithMembers = useQuery(api.groupMembers.getGroupMembersGrouped);

  if (groupsWithMembers === undefined) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeGroup = groupsWithMembers.find((group) => group.group._id === groupId);
  const members = activeGroup?.members ?? [];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Group Members</h2>

      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm pl-4">
            No other members in this group yet.
          </p>
        ) : (
          members.map((member) => (
            <button
              key={member._id}
              onClick={() => onSelectMember(member._id)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="text-primary">
                  View Gift List →
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
