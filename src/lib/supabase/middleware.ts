import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAuthPublicPath,
  isEmailVerified,
  needsProfileSetup,
} from "@/lib/auth";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    return supabaseResponse;
  }

  if (!isEmailVerified(user)) {
    if (
      !isAuthPublicPath(pathname) &&
      pathname !== "/verify-email"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-email";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", user.id)
    .single();

  if (needsProfileSetup(profile)) {
    const allowedDuringSetup =
      pathname === "/profile/setup" || isAuthPublicPath(pathname);

    if (!allowedDuringSetup) {
      const url = request.nextUrl.clone();
      url.pathname = "/profile/setup";
      return NextResponse.redirect(url);
    }
  } else if (pathname === "/profile/setup") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
