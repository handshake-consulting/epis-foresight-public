import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: (process.env.NODE_ENV === 'development') ? false : true,
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "twneftabwsebtktuyyni.supabase.co",
      },
      {
        hostname: "localhost",
      },

      new URL('https://hirkdktetwp0nphp.public.blob.vercel-storage.com/images/**')

    ]
  }
};

export default nextConfig;
