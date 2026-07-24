import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isSignedIn = !!getSessionCookie(request);

	if (pathname.startsWith("/workspace") && !isSignedIn) {
		return NextResponse.redirect(new URL("/?signin=true", request.url));
	}

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-opal-authenticated", isSignedIn ? "1" : "0");

	return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
	matcher: ["/", "/workspace/:path*"],
};
