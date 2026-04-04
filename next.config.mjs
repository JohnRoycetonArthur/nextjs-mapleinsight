/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Exclude headless browser packages from webpack bundling (US-14.1)
  // These are Node.js native modules used only in API route handlers
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium-min'],
  },
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.mapleinsight.ca" }], destination: "https://mapleinsight.ca/:path*", permanent: true },
      { source: "/start-here",          destination: "/settlement-plan", permanent: true },
      { source: "/start-here/:path*",   destination: "/settlement-plan", permanent: true },
      { source: "/articles/financially-ready-move-to-canada", destination: "/immigration-costs", permanent: true },
    ];
  },
};

export default nextConfig;
