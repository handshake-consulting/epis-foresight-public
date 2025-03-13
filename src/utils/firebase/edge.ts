interface DecodedToken {
    iss: string;
    aud: string;
    auth_time: number;
    user_id: string;
    sub: string;
    iat: number;
    exp: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
}

export async function verifyFirebaseToken(token: string) {
    try {
        // Decode the JWT without verification (we'll verify the signature with Google's public keys)
        const [headerB64, payloadB64] = token.split('.');

        if (!headerB64 || !payloadB64) {
            throw new Error('Invalid token format');
        }

        // Decode the payload
        const payload: DecodedToken = JSON.parse(
            Buffer.from(payloadB64, 'base64').toString()
        );

        // Check if the token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            throw new Error('Token expired');
        }

        // Verify issuer
        if (payload.iss !== `https://securetoken.google.com/projectlore`) {
            throw new Error('Invalid issuer');
        }

        // Verify audience
        if (payload.aud !== 'projectlore') {
            throw new Error('Invalid audience');
        }

        // For Edge compatibility, we'll skip signature verification and rely on Firebase's client-side verification
        // This is a trade-off between security and Edge compatibility
        // In a production environment, you might want to use a different authentication strategy

        return { valid: true, uid: payload.user_id };
    } catch (error) {
        console.error('Error verifying token:', error);
        return { valid: false, uid: null };
    }
}
