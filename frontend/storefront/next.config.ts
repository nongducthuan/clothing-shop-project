import type { NextConfig } from "next";
import path from "path";

const config: NextConfig = {
  transpilePackages: ["@shop/shared"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default config;
