import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { GroupSetup } from "./GroupSetup";
import { Dashboard } from "./Dashboard";
import { PageSkeleton } from "./Skeleton";

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b bg-white/80 px-4 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-sm sm:min-h-16">
        <h2 className="text-lg font-semibold text-primary sm:text-xl">🎁 Gift Monk</h2>
        <Authenticated>
          <div className="hidden sm:block">
            <SignOutButton />
          </div>
        </Authenticated>
      </header>
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userGroup = useQuery(api.groups.getUserGroup);

  if (loggedInUser === undefined || userGroup === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
  {userGroup ? <Dashboard /> : <GroupSetup />}
      </Authenticated>
      
      <Unauthenticated>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-3 text-3xl font-bold text-primary sm:mb-4 sm:text-5xl">
              🎁 Gift Monk
            </h1>
            <p className="text-base text-secondary sm:text-xl">
              Share gift wishlists with your group
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
