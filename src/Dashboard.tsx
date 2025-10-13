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
  const userGroup = useQuery(api.groups.getUserGroup);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (!userGroup || !loggedInUser) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {userGroup.name}
        </h1>
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
        {activeTab === "my-list" && <MyGiftList />}
        {activeTab === "group" && !selectedMemberId && (
          <GroupMembersList onSelectMember={setSelectedMemberId} />
        )}
        {activeTab === "account" && <Account />}
        {selectedMemberId && (
          <MemberGiftList
            memberId={selectedMemberId}
            onBack={() => setSelectedMemberId(null)}
          />
        )}
      </div>
    </div>
  );
}
