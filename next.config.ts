import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://soulrep-gym.vercel.app",
  },
};

export default nextConfig;
