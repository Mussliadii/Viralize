import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These resolve native binary paths via __dirname at runtime — bundling
  // them rewrites that to a bogus path (e.g. "\ROOT\..."). Keep them as
  // plain Node `require()` instead.
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static", "msedge-tts"],
};

export default nextConfig;
