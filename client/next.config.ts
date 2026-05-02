import path from 'path';
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['inngest', '@inngest/agent-kit'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'child_process': 'commonjs child_process',
        'fs': 'commonjs fs',
        'path': 'commonjs path',
        'os': 'commonjs os',
      });
    }

    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      child_process: false,
    };

    // Patch all missing inngest subpath exports required by @inngest/agent-kit
    config.resolve.alias = {
      ...config.resolve.alias,
      'inngest/helpers/errors': path.resolve('./node_modules/inngest/helpers/errors.js'),
      'inngest/components/InngestFunction': path.resolve('./node_modules/inngest/components/InngestFunction.js'),
      'inngest/experimental': path.resolve('./node_modules/inngest/experimental.js'),
      'inngest/types': path.resolve('./node_modules/inngest/types.js'),
      'inngest/node': path.resolve('./node_modules/inngest/node.js'),
      'inngest/ai': path.resolve('./node_modules/inngest/index.js'),
    };

    return config;
  },
};

export default nextConfig;