import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface GroupMembersListProps {
  onSelectMember: (memberId: string) => void;
}

export function GroupMembersList({ onSelectMember }: GroupMembersListProps) {
  const groupsWithMembers = useQuery(api.groupMembers.getGroupMembersGrouped);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Group Members</h2>
      
      <div className="space-y-6">
        {groupsWithMembers?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No group members found. Join or create a group to get started!
          </p>
        ) : (
          groupsWithMembers?.map((groupGroup) => (
            <div key={groupGroup.group._id} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                {groupGroup.group.name}
                {groupGroup.group.isActive && (
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </h3>
              
              <div className="space-y-3">
                {groupGroup.members.length === 0 ? (
                  <p className="text-gray-500 text-sm pl-4">
                    No other members in this group yet.
                  </p>
                ) : (
                  groupGroup.members.map((member) => (
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
                          View Gift List 12;
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
