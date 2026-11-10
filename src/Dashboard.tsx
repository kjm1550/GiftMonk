import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MyGiftList } from "./MyGiftList";
import { GroupMembersList } from "./GroupMembersList";
import { MemberGiftList } from "./MemberGiftList";
import { Account } from "./Account";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"my-list" | "group" | "account">("my-list");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const userGroups = useQuery(api.groups.getUserGroups);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (userGroups === undefined || loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fall back to the first group if the selected one is gone (e.g. after leaving it)
  const activeGroup =
    userGroups.find((group) => group._id === selectedGroupId) ?? userGroups[0];

  if (!activeGroup) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <p className="text-gray-500">You're not part of any groups yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {activeGroup.name}
        </h1>
        {userGroups.length > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm text-secondary mb-2">
            <label htmlFor="group-switcher">Group</label>
            <select
              id="group-switcher"
              value={activeGroup._id}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setSelectedMemberId(null);
              }}
              className="px-3 py-1.5 rounded border border-gray-200 bg-white text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {userGroups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <p className="text-secondary">
          Welcome back, {loggedInUser.name || loggedInUser.email}!
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg p-1 shadow-sm border">
          <button
            onClick={() => {
              setActiveTab("my-list");
              setSelectedMemberId(null);
            }}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "my-list"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            My Gift List
          </button>
          <button
            onClick={() => {
              setActiveTab("group");
              setSelectedMemberId(null);
            }}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "group"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            Group Members
          </button>
          <button
            onClick={() => {
              setActiveTab("account");
              setSelectedMemberId(null);
            }}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "account"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            Account
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {activeTab === "my-list" && <MyGiftList groupId={activeGroup._id} />}
        {activeTab === "group" && !selectedMemberId && (
          <GroupMembersList groupId={activeGroup._id} onSelectMember={setSelectedMemberId} />
        )}
        {activeTab === "account" && (
          <Account
            onSelectGroup={(groupId) => {
              setSelectedGroupId(groupId);
              setSelectedMemberId(null);
              setActiveTab("my-list");
            }}
          />
        )}
        {selectedMemberId && (
          <MemberGiftList
            memberId={selectedMemberId}
            groupId={activeGroup._id}
            onBack={() => setSelectedMemberId(null)}
          />
        )}
      </div>
    </div>
  );
}
