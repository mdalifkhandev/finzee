const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude the web-only Vite/Lovable directories from React Native bundling.
// Use anchored paths so node_modules internals are NOT affected.
const projectRoot = __dirname;
config.resolver.blockList = [
  new RegExp(`^${projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/src/.*`),
  new RegExp(`^${projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/public/.*`),
  new RegExp(`^${projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/supabase/.*`),
  new RegExp(`^${projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/backend/.*`),
];

module.exports = config;
