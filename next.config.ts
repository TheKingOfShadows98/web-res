import type { NextConfig } from "next";
import path from "node:path";

const activeTheme = process.env.NEXT_PUBLIC_ACTIVE_THEME || "default";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "@/active-theme": `./src/themes/${activeTheme}`,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/active-theme": path.resolve(__dirname, `src/themes/${activeTheme}`),
    };
    return config;
  },
};

export default nextConfig;
