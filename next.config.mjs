/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // Static export so the app can be served from the filesystem inside Tauri (no Node backend).
  output: "export",
  // Disabled: React 19 StrictMode double-invokes effects in dev, which makes
  // @tanstack/react-virtual / react-table (both latest) log a false-positive
  // "state update before mount" warning. No production impact either way.
  reactStrictMode: false,
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
