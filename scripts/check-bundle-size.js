const fs = require('fs');
const path = require('path');

const budgetPath = path.resolve(__dirname, '../.bundle-budget.json');
const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf-8'));
const defaultMaxKb = budget.maxFirstLoadJsKb || 150;

// Read the build log
const logPath = path.resolve(__dirname, '../build-log.txt');
if (!fs.existsSync(logPath)) {
  console.error("No build-log.txt found. Ensure you run 'npm run build > build-log.txt 2>&1' first.");
  process.exit(1);
}

const logContentRaw = fs.readFileSync(logPath, 'utf8');
const logContent = logContentRaw.replace(/\x1B\[[0-9;]*[mK]/g, '');

// A basic regex to parse Next.js build output table for First Load JS
// e.g. ┌ ƒ /       146 B          84.3 kB
//      ├ ƒ /events 2.53 kB        86.7 kB
// We match the route path and the First Load JS size in kB or MB.

const routeRegex = /^[┌├└]\s+[ƒ○λ]\s+(\S+)\s+.*?([0-9.]+)\s+(kB|MB)$/gm;
let match;
let failed = false;

while ((match = routeRegex.exec(logContent)) !== null) {
  const route = match[1];
  const sizeValue = parseFloat(match[2]);
  const unit = match[3];

  let sizeInKb = sizeValue;
  if (unit === 'MB') {
    sizeInKb = sizeValue * 1024;
  }

  // Skip API routes which typically don't have JS bundles in the same way
  if (route.startsWith('/api/')) continue;

  const allowedLimit = budget.routes && budget.routes[route] ? budget.routes[route] : defaultMaxKb;

  if (sizeInKb > allowedLimit) {
    console.error(`\u274C Bundle size exceeded for route '${route}': ${sizeInKb.toFixed(2)} kB (Limit: ${allowedLimit} kB) - Delta: +${(sizeInKb - allowedLimit).toFixed(2)} kB`);
    failed = true;
  } else {
    console.log(`\u2705 Route '${route}': ${sizeInKb.toFixed(2)} kB (Limit: ${allowedLimit} kB)`);
  }
}

if (failed) {
  console.error("\nBundle size check failed! Please optimize your imports or increase the budget if intentional.");
  process.exit(1);
} else {
  console.log("\nBundle size check passed.");
  process.exit(0);
}
