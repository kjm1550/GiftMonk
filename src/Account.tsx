import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function Account() {
  const [name, setName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userGroups = useQuery(api.groups.getUserGroups);
  const allGroups = useQuery(api.groups.getAllGroups);
  
  const updateUserName = useMutation(api.account.updateUserName);
  const setActiveGroup = useMutation(api.account.setActiveGroup);
  const leaveGroup = useMutation(api.account.leaveGroup);
  const joinGroup = useMutation(api.groups.joinGroup);
  const createGroup = useMutation(api.groups.createGroup);

  // Initialize name field when user data loads
  useEffect(() => {
    if (loggedInUser?.name) {
      setName(loggedInUser.name);
    } else if (loggedInUser?.email) {
      setName(loggedInUser.email);
    }
  }, [loggedInUser]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateUserName({ name: name.trim() });
      toast.success("Name updated successfully!");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleSetActiveGroup = async (groupId: string) => {
    try {
      await setActiveGroup({ groupId: groupId as any });
      toast.success("Active group changed!");
    } catch {
      toast.error("Failed to change active group");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (userGroups && userGroups.length <= 1) {
      toast.error("You must be part of at least one group");
      return;
    }

    try {
      await leaveGroup({ groupId: groupId as any });
      toast.success("Left group successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to leave group");
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    try {
      await joinGroup({ groupId: selectedGroupId as any });
      toast.success("Joined group successfully!");
      setShowJoinGroup(false);
      setSelectedGroupId("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to join group");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      await createGroup({ name: newGroupName.trim() });
      toast.success("Group created successfully!");
      setShowCreateGroup(false);
      setNewGroupName("");
    } catch {
      toast.error("Failed to create group");
    }
  };

  // Filter out groups user is already part of
  const availableGroups = allGroups?.filter(
    group => !userGroups?.some(userGroup => userGroup._id === group._id)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Account Settings</h1>
  <p className="text-secondary">Manage your profile and group memberships</p>
      </div>

      {/* User Profile */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
  <form onSubmit={(e) => void handleUpdateName(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={loggedInUser?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded border border-gray-200 bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Update Name
          </button>
        </form>
      </div>

      {/* Group Management */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Group Memberships</h2>
        
        <div className="space-y-3 mb-6">
          {userGroups?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              You're not part of any groups yet.
            </p>
          ) : (
            userGroups?.map((group) => (
              <div
                key={group._id}
                className={`p-4 border rounded-lg ${
                  group.isActive ? "border-primary bg-primary/5" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {group.name}
                      {group.isActive && (
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                      {!group.isActive && (
                      <button
                        onClick={() => void handleSetActiveGroup(group._id)}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => void handleLeaveGroup(group._id)}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={userGroups && userGroups.length <= 1}
                      title={userGroups && userGroups.length <= 1 ? "You must be part of at least one group" : ""}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinGroup(!showJoinGroup)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showJoinGroup ? "Cancel" : "Join Group"}
          </button>
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {showCreateGroup ? "Cancel" : "Create Group"}
          </button>
        </div>

  {/* Join Group Form */}
        {showJoinGroup && (
          <form onSubmit={(e) => void handleJoinGroup(e)} className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Join Existing Group</h3>
            {availableGroups && availableGroups.length === 0 ? (
              <p className="text-gray-500 text-sm mb-3">
                No other groups available to join.
              </p>
            ) : (
              <>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-3"
                >
                  <option value="">Select a group...</option>
                  {availableGroups?.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedGroupId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Join
                </button>
              </>
            )}
          </form>
        )}

  {/* Create Group Form */}
        {showCreateGroup && (
          <form onSubmit={(e) => void handleCreateGroup(e)} className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Create New Group</h3>
            <input
              type="text"
              placeholder="Group name (e.g., The Smiths)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-4 py-3 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-3"
            />
            <button
              type="submit"
              disabled={!newGroupName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
