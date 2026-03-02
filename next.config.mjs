/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {},
  async redirects() {
    return [
      // Redirect www -> apex domain (works when both are attached in Vercel)
      { source: '/:path*', has: [{ type: 'host', value: 'www.mapleinsight.ca' }], destination: 'https://mapleinsight.ca/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
