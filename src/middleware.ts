import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Return early if on auth-related paths (to allow authentication flow)
    // or if already on chat path
    if (
        // request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/home') ||
        request.nextUrl.pathname.startsWith('/article') ||
        request.nextUrl.pathname.startsWith('/settings-demo')
    ) {
        return NextResponse.next();
    }

    // For all other paths, redirect to /chat
    const url = request.nextUrl.clone();
    url.pathname = '/article';
    return NextResponse.redirect(url);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
