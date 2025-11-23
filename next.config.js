/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'assets.coingecko.com', 'raw.githubusercontent.com'],
  },
};

module.exports = nextConfig;
