const { evaluateBudget } = require('../check-bundle-size');

describe('check-bundle-size evaluateBudget', () => {
  it('passes when all routes are under budget', () => {
    const sizes = [
      { route: '/', sizeInKb: 100 },
      { route: '/about', sizeInKb: 140 }
    ];
    const budget = { maxFirstLoadJsKb: 150 };
    
    const result = evaluateBudget(sizes, budget);
    
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].passed).toBe(true);
    expect(result.results[1].passed).toBe(true);
  });

  it('passes when exactly at budget', () => {
    const sizes = [{ route: '/dashboard', sizeInKb: 150 }];
    const budget = { maxFirstLoadJsKb: 150 };
    
    const result = evaluateBudget(sizes, budget);
    
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.results[0].passed).toBe(true);
  });

  it('fails when a route is over budget', () => {
    const sizes = [
      { route: '/', sizeInKb: 100 },
      { route: '/dashboard', sizeInKb: 200 }
    ];
    const budget = { maxFirstLoadJsKb: 150 };
    
    const result = evaluateBudget(sizes, budget);
    
    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.results[0].passed).toBe(true);
    expect(result.results[1].passed).toBe(false);
    expect(result.results[1].delta).toBe(50);
  });

  it('uses route-specific budget (missing-entry uses default)', () => {
    const sizes = [
      { route: '/heavy', sizeInKb: 300 }, // Over default, but under custom
      { route: '/normal', sizeInKb: 160 } // Over default
    ];
    const budget = {
      maxFirstLoadJsKb: 150,
      routes: {
        '/heavy': 500
      }
    };
    
    const result = evaluateBudget(sizes, budget);
    
    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.results[0].passed).toBe(true); // /heavy allowed 500
    expect(result.results[1].passed).toBe(false); // /normal allowed 150
  });

  it('handles malformed budget file (invalid JSON string)', () => {
    const sizes = [{ route: '/', sizeInKb: 100 }];
    const budgetString = '{ invalid json ';
    
    const result = evaluateBudget(sizes, budgetString);
    
    expect(result.exitCode).toBe(1);
    expect(result.failed).toBe(true);
    expect(result.error).toBe('Malformed budget file');
  });

  it('skips API routes', () => {
    const sizes = [
      { route: '/api/users', sizeInKb: 500 }, // Should be skipped even if over budget
      { route: '/', sizeInKb: 100 }
    ];
    const budget = { maxFirstLoadJsKb: 150 };
    
    const result = evaluateBudget(sizes, budget);
    
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.results).toHaveLength(1); // Only '/' is evaluated
    expect(result.results[0].route).toBe('/');
  });

  it('handles empty or missing budget gracefully', () => {
    const sizes = [{ route: '/', sizeInKb: 100 }];
    const result = evaluateBudget(sizes, null); // Falls back to defaults
    
    expect(result.exitCode).toBe(0);
    expect(result.failed).toBe(false);
    expect(result.results[0].allowedLimit).toBe(150); // default limit
  });
});
