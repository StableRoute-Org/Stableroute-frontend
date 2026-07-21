const fs = require('fs');
const path = require('path');

function evaluateBudget(sizes, budget) {
  let parsedBudget = budget;
  if (typeof budget === 'string') {
    try {
      parsedBudget = JSON.parse(budget);
    } catch (e) {
      return {
        failed: true,
        exitCode: 1,
        results: [],
        error: 'Malformed budget file',
      };
    }
  }

  if (!parsedBudget || typeof parsedBudget !== 'object') {
    parsedBudget = {};
  }

  const defaultMaxKb = parsedBudget.maxFirstLoadJsKb || 150;
  let failed = false;
  const results = [];

  for (const { route, sizeInKb } of sizes) {
    if (route.startsWith('/api/')) continue;
    const allowedLimit =
      parsedBudget.routes && parsedBudget.routes[route]
        ? parsedBudget.routes[route]
        : defaultMaxKb;

    if (sizeInKb > allowedLimit) {
      results.push({
        route,
        passed: false,
        sizeInKb,
        allowedLimit,
        delta: sizeInKb - allowedLimit,
      });
      failed = true;
    } else {
      results.push({ route, passed: true, sizeInKb, allowedLimit, delta: 0 });
    }
  }

  return { failed, exitCode: failed ? 1 : 0, results };
}

function runCheck() {
  const budgetPath = path.resolve(__dirname, '../.bundle-budget.json');
  let budgetContent = '{}';
  if (fs.existsSync(budgetPath)) {
    budgetContent = fs.readFileSync(budgetPath, 'utf-8');
  } else {
    console.error(`No .bundle-budget.json found at ${budgetPath}.`);
    process.exit(1);
  }

  const logPath = path.resolve(__dirname, '../build-log.txt');
  if (!fs.existsSync(logPath)) {
    console.error(
      "No build-log.txt found. Ensure you run 'npm run build > build-log.txt 2>&1' first."
    );
    process.exit(1);
  }

  const logContentRaw = fs.readFileSync(logPath, 'utf8');
  const logContent = logContentRaw.replace(/\x1B\[[0-9;]*[mK]/g, '');

  const routeRegex = /^[┌├└]\s+[ƒ○λ]\s+(\S+)\s+.*?([0-9.]+)\s+(kB|MB)$/gm;
  let match;
  const sizes = [];

  while ((match = routeRegex.exec(logContent)) !== null) {
    const route = match[1];
    const sizeValue = parseFloat(match[2]);
    const unit = match[3];

    let sizeInKb = sizeValue;
    if (unit === 'MB') {
      sizeInKb = sizeValue * 1024;
    }
    sizes.push({ route, sizeInKb });
  }

  const { failed, exitCode, results, error } = evaluateBudget(
    sizes,
    budgetContent
  );

  if (error) {
    console.error(`\u274C Bundle size check failed: ${error}`);
    process.exit(exitCode);
  }

  for (const res of results) {
    if (!res.passed) {
      console.error(
        `\u274C Bundle size exceeded for route '${res.route}': ${res.sizeInKb.toFixed(2)} kB (Limit: ${res.allowedLimit} kB) - Delta: +${res.delta.toFixed(2)} kB`
      );
    } else {
      console.log(
        `\u2705 Route '${res.route}': ${res.sizeInKb.toFixed(2)} kB (Limit: ${res.allowedLimit} kB)`
      );
    }
  }

  if (failed) {
    console.error(
      '\nBundle size check failed! Please optimize your imports or increase the budget if intentional.'
    );
  } else {
    console.log('\nBundle size check passed.');
  }
  process.exit(exitCode);
}

module.exports = { evaluateBudget, runCheck };

if (require.main === module) {
  runCheck();
}
