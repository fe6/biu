#!/usr/bin/env node
/** @format */

try {
  require('../dist/cli/index.js').run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
