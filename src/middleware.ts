import { verifyFirebaseToken } from '@/utils/firebase/edge';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token');

    // Return early if on auth-related paths or chat path (to allow automatic login)
    if (
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/chat')
    ) {
        return NextResponse.next();
    }

    // Check if we have a token
    if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    try {
        // Verify the token
        const { valid } = await verifyFirebaseToken(token.value);
        if (!valid) {
            throw new Error('Invalid token');
        }
        return NextResponse.next();
    } catch (error) {
        // Token is invalid or expired
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
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
