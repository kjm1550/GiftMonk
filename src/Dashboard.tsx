import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MyGiftList } from "./MyGiftList";
import { GroupGiftLists } from "./GroupGiftLists";
import { Account } from "./Account";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "my-list" | "group-gifts" | "account"
  >("my-list");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const userGroups = useQuery(api.groups.getUserGroups);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (userGroups === undefined || loggedInUser === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fall back to the first group if the selected one is gone (e.g. after leaving it)
  const activeGroup =
    userGroups.find((group) => group._id === selectedGroupId) ?? userGroups[0];

  if (!activeGroup) {
    return (
      <div className="rounded-lg border bg-white p-4 text-center shadow-sm sm:p-6">
        <p className="text-gray-500">You're not part of any groups yet.</p>
      </div>
    );
  }

  const tabs = [
    {
      id: "my-list",
      label: "My Gift Lists",
      shortLabel: "My Lists",
      icon: "🎁",
    },
    {
      id: "group-gifts",
      label: "Group's Gift Lists",
      shortLabel: "Group",
      icon: "👥",
    },
    { id: "account", label: "Account", shortLabel: "Account", icon: "👤" },
  ] as const;

  return (
    <div className="pb-24 sm:pb-0">
      <div className="mb-4 text-center sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
          {activeGroup.name}
        </h1>
        {userGroups.length > 1 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-sm text-secondary">
            <label htmlFor="group-switcher">Group</label>
            <select
              id="group-switcher"
              value={activeGroup._id}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
              }}
              className="min-h-11 max-w-full rounded border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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

      {/* Desktop / tablet tabs */}
      <div className="mb-6 hidden justify-center sm:flex">
        <div className="flex w-auto justify-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 rounded-md px-6 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-sm sm:hidden"
      >
        <div className="grid grid-cols-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {tab.icon}
                </span>
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        {activeTab === "my-list" && (
          <MyGiftList key={activeGroup._id} groupId={activeGroup._id} />
        )}
        {activeTab === "group-gifts" && (
          <GroupGiftLists key={activeGroup._id} groupId={activeGroup._id} />
        )}
        {activeTab === "account" && (
          <Account
            onSelectGroup={(groupId) => {
              setSelectedGroupId(groupId);
              setActiveTab("my-list");
            }}
          />
        )}
      </div>
    </div>
  );
}
