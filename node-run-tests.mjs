import { runUnitTests } from './js/tests.js';

(async () => {
  try {
    const summary = await runUnitTests();
    if (summary && typeof summary.allTestsPassed === 'boolean') {
      process.exitCode = summary.allTestsPassed ? 0 : 1;
    } else {
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Error running tests:', err);
    process.exitCode = 1;
  }
})();
