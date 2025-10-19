import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { GroupSetup } from "./GroupSetup";
import { Dashboard } from "./Dashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">🎁 Gift Monk</h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 p-8">
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
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
  {userGroup ? <Dashboard /> : <GroupSetup />}
      </Authenticated>
      
      <Unauthenticated>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-primary mb-4">🎁 Gift Monk</h1>
            <p className="text-xl text-secondary">
              Share gift wishlists with your group
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
