import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://proyecto-benchamen.onrender.com";
    return [
      {
        source: "/api/:path((?!whatsapp/webhook$).*)",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
