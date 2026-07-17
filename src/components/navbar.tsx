import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogOutButton } from "./logout-button";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-brand-700">
          J&J Scoring
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/competitions" className="text-sm text-gray-600 hover:text-gray-900">
            Competitions
          </Link>

          {user && profile?.role === "admin" && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          )}

          {user && profile?.role === "judge" && (
            <Link href="/judge" className="text-sm text-gray-600 hover:text-gray-900">
              Judge Panel
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {profile?.full_name ?? user.email}
              </span>
              <LogOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
