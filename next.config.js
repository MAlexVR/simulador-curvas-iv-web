/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features for Next.js 15
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
};

module.exports = nextConfig;
