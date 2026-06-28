/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // Static export so the app can be served from the filesystem inside Tauri (no Node backend).
  output: "export",
  reactStrictMode: true,
  // Tauri serves files directly; disable Next.js image optimization which needs a server.
  images: {
    unoptimized: true,
  },
  // Avoids issues with three.js / R3F transitive deps during static export.
  transpilePackages: ["three"],
  // Keep trailing slashes consistent for file:// asset resolution in Tauri.
  trailingSlash: true,
};

export default nextConfig;
