/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a standalone output bundle — faster cold starts on Vercel/Docker
  output: "standalone",

  // Compress responses with gzip/brotli
  compress: true,

  // Optimise images served via next/image
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Strict React mode highlights potential issues during development
  reactStrictMode: true,

  // Remove powered-by header for minor security hardening
  poweredByHeader: false,
};

module.exports = nextConfig;
