/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8787";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ark/shared"],
  experimental: {
    // The proxy in front of the API caps request bodies at 10MB by default, which
    // truncated every save-archive / mod upload over that and surfaced as an
    // ECONNRESET in the API (GH #10). Match the API's own 1 GiB multer limit.
    middlewareClientMaxBodySize: "1gb",
  },
  // Don't auto-redirect `/socket.io/` → `/socket.io`; that fires before the rewrite
  // and breaks the socket.io polling handshake (it needs the trailing slash).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Proxy API + socket.io through the web origin so the browser only needs one
    // host (reverse-proxy friendly; PLANNING.md → UI access).
    return [
      { source: "/api/:path*", destination: `${apiTarget}/api/:path*` },
      { source: "/socket.io/:path*", destination: `${apiTarget}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
