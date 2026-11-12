import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { BottomSheet } from "./BottomSheet";
import { SignOutButton } from "./SignOutButton";

interface AccountProps {
  onSelectGroup: (groupId: string) => void;
}

export function Account({ onSelectGroup }: AccountProps) {
  const [name, setName] = useState("");
  const [groupToJoinId, setGroupToJoinId] = useState("");
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupToLeave, setGroupToLeave] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userGroups = useQuery(api.groups.getUserGroups);
  const allGroups = useQuery(api.groups.getAllGroups);
  
  const updateUserName = useMutation(api.account.updateUserName);
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

  const handleLeaveGroup = async () => {
    if (!groupToLeave) return;

    if (userGroups && userGroups.length <= 1) {
      toast.error("You must be part of at least one group");
      setGroupToLeave(null);
      return;
    }

    setIsLeavingGroup(true);
    try {
      await leaveGroup({ groupId: groupToLeave.id as any });
      toast.success("Left group and deleted your gift lists.");
      setGroupToLeave(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to leave group");
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupToJoinId) return;

    try {
      await joinGroup({ groupId: groupToJoinId as any });
      toast.success("Joined group successfully!");
      setShowJoinGroup(false);
      setGroupToJoinId("");
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
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="mb-4 text-center sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-secondary">Manage your profile and group memberships</p>
      </div>

      {/* User Profile */}
      <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
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
            className="min-h-11 w-full rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover sm:w-auto"
          >
            Update Name
          </button>
        </form>
      </div>

      {/* Group Management */}
      <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
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
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="min-w-0 break-words font-medium text-gray-900">
                    {group.name}
                  </h3>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => onSelectGroup(group._id)}
                      className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-primary-hover"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        setGroupToLeave({ id: group._id, name: group.name })
                      }
                      className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="grid grid-cols-1 gap-2 sm:flex">
          <button
            onClick={() => setShowJoinGroup(!showJoinGroup)}
            className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            {showJoinGroup ? "Cancel" : "Join Group"}
          </button>
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="min-h-11 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
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
                  value={groupToJoinId}
                  onChange={(e) => setGroupToJoinId(e.target.value)}
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
                  disabled={!groupToJoinId}
                  className="min-h-11 w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
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
              className="min-h-11 w-full rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:w-auto"
            >
              Create
            </button>
          </form>
        )}
      </div>

      {/* Session (mobile only; desktop sign-out lives in the header) */}
      <div className="rounded-lg border bg-white p-4 shadow-sm sm:hidden">
        <h2 className="mb-1 text-xl font-semibold">Session</h2>
        <p className="mb-3 text-sm text-gray-500">
          Sign out of Gift Monk on this device.
        </p>
        <SignOutButton className="w-full" />
      </div>

      <BottomSheet
        open={Boolean(groupToLeave)}
        onClose={() => {
          if (!isLeavingGroup) setGroupToLeave(null);
        }}
        title={groupToLeave ? `Leave "${groupToLeave.name}"?` : "Leave group?"}
      >
        <p className="text-sm text-gray-600">
          Your gift lists and their gifts in this group will be permanently
          deleted. This cannot be undone.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setGroupToLeave(null)}
            disabled={isLeavingGroup}
            autoFocus
            className="min-h-11 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleLeaveGroup()}
            disabled={isLeavingGroup}
            className="min-h-11 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isLeavingGroup ? "Leaving..." : "Leave Group"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
