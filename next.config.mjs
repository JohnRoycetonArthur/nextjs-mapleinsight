/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.mapleinsight.ca" }], destination: "https://mapleinsight.ca/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
