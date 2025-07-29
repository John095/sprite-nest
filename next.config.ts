/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['sprite-nest.supabase.co'],
  },
};

module.exports = nextConfig;