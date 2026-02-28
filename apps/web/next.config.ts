import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [".prisma/client"],
  turbopack: {
    resolveAlias: {
      ".prisma/client": ".prisma/client",
    },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};

export default nextConfig;
