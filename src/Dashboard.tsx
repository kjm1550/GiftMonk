import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MyGiftList } from "./MyGiftList";
import { GroupGiftLists } from "./GroupGiftLists";
import { Account } from "./Account";
import { PageSkeleton } from "./Skeleton";

function MobileTabIcon({
  tab,
  className,
}: {
  tab: "my-list" | "group-gifts" | "account";
  className?: string;
}) {
  if (tab === "my-list") {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </svg>
    );
  }

  if (tab === "group-gifts") {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "my-list" | "group-gifts" | "account"
  >("my-list");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const userGroups = useQuery(api.groups.getUserGroups);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (userGroups === undefined || loggedInUser === undefined) {
    return <PageSkeleton />;
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
    },
    {
      id: "group-gifts",
      label: "Group's Gift Lists",
      shortLabel: "Group",
    },
    { id: "account", label: "Account", shortLabel: "Account" },
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
                className="flex min-h-16 flex-col items-center justify-center text-xs font-medium transition-colors"
              >
                <span
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-1.5 transition-colors ${
                    isActive
                      ? "bg-gray-100 font-semibold text-primary shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  <MobileTabIcon
                    tab={tab.id}
                    className="h-5 w-5 drop-shadow-sm"
                  />
                  <span>{tab.shortLabel}</span>
                </span>
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
