"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { cn } from "./lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className={cn(
        "min-h-11 rounded border border-gray-200 bg-white px-4 py-2 font-semibold text-secondary shadow-sm transition-colors hover:bg-gray-50 hover:text-secondary-hover hover:shadow",
        className,
      )}
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}
