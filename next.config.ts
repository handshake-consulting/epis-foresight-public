import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "twneftabwsebtktuyyni.supabase.co",
      }
    ]
  }
};

export default nextConfig;
