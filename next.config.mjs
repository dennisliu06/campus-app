/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  images: {
    remotePatterns: [
    {
      protocol: "https",
      hostname: "firebasestorage.googleapis.com",
      pathname: "/**"
    }
  ],
  },

  webpack(config, { dev }) {
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
