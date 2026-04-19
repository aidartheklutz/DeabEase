const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclusion list for the watcher to prevent EMFILE errors
const exclusionList = [
  /node_modules\/.*\/node_modules/, // Nested node_modules
  /ios\/.*/,
  /android\/.*/,
  /\.git\/.*/,
];

config.resolver.blockList = exclusionList;

module.exports = config;
