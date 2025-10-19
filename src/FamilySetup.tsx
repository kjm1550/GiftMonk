import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function GroupSetup() {
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  
  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);
  const allGroups = useQuery(api.groups.getAllGroups);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      await createGroup({ name: groupName });
      toast.success("Group created successfully!");
    } catch {
      toast.error("Failed to create group");
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    try {
      await joinGroup({ groupId: selectedGroupId as any });
      toast.success("Joined group successfully!");
    } catch {
      toast.error("Failed to join group");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Gift Monk!</h1>
        <p className="text-secondary">Create or join a group to get started</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {!showJoinGroup ? (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-4">Create a New Group</h2>
              <form onSubmit={(e) => void handleCreateGroup(e)} className="space-y-4">
                <input
                  type="text"
                  placeholder="Group name (e.g., The Smiths)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <button
                  type="submit"
                  disabled={!groupName.trim()}
                  className="w-full px-4 py-3 rounded bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  Create Group
                </button>
              </form>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowJoinGroup(true)}
                className="text-primary hover:underline"
              >
                Or join an existing group
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-4">Join Existing Group</h2>
              <form onSubmit={(e) => void handleJoinGroup(e)} className="space-y-4">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Select a group...</option>
                  {allGroups?.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedGroupId}
                  className="w-full px-4 py-3 rounded bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  Join Group
                </button>
              </form>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowJoinGroup(false)}
                className="text-primary hover:underline"
              >
                Or create a new group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
