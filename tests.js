function runUnitTests() {
        console.log("%cExecuting Unit Tests...", "color: blue; font-size: 16px; font-weight: bold;");
        let allTestsPassed = true;
        let testsRun = 0;
        let testsPassed = 0;

        function deepEqual(obj1, obj2) {
            if (obj1 === obj2) return true;
            if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
                return false;
            }
            let keys1 = Object.keys(obj1);
            let keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length) return false;
            for (let key of keys1) {
                if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
                    return false;
                }
            }
            return true;
        }

        function assertEqual(actual, expected, testName) {
            testsRun++;
            const isEqual = deepEqual(actual, expected);
            if (isEqual) {
                console.log(`%cPASS: ${testName}`, "color: green;");
                testsPassed++;
            } else {
                console.error(`%cFAIL: ${testName}`, "color: red; font-weight: bold;");
                console.log("  Expected:", JSON.stringify(expected));
                console.log("  Actual:  ", JSON.stringify(actual));
                allTestsPassed = false;
            }
            return isEqual;
        }

        function testSerieDefFromString() {
            console.log("\n-- Testing fn.serieDefFromString --");
            assertEqual(fn.serieDefFromString("1+1x2"), [{ initial: 1, increment: 1, steps: 2}], "Simple positive increment");
            assertEqual(fn.serieDefFromString("-2+4x3"), [{ initial: -2, increment: 4, steps: 3}], "Negative initial, positive increment");
            assertEqual(fn.serieDefFromString("1-2x4"), [{ initial: 1, increment: -2, steps: 4}], "Positive initial, negative increment (via minus)");
            assertEqual(fn.serieDefFromString("1x4"), [{ initial: 1, increment: 0, steps: 4}], "Shorthand 'axn'");
            assertEqual(fn.serieDefFromString("#+1x1"), [{ initial: "#", increment: 1, steps: 1}], "Continue series '#'");
            assertEqual(fn.serieDefFromString("#x2"), [{ initial: "#", increment: 0, steps: 2}], "Continue series shorthand '#xn'");
            assertEqual(fn.serieDefFromString("_"), [{ initial: "_", increment: '_' }], "Single underscore");
            assertEqual(fn.serieDefFromString("_x3"), [{ initial: "_", increment: '_', steps: 3 }], "Underscore repeat '_xn'");
            assertEqual(fn.serieDefFromString("0.5+0.1x2"), [{ initial: 0.5, increment: 0.1, steps: 2}], "Decimal values");
        }

        function testMakeSerie() {
            console.log("\n-- Testing fn.makeSerie --");
            assertEqual(fn.makeSerie(fn.serieDefFromString("1+1x2")), [1, 2, 3], "Simple series 1+1x2"); // 1, then 2 further steps
            assertEqual(fn.makeSerie(fn.serieDefFromString("-2+4x3")), [-2, 2, 6, 10], "Series -2+4x3");
            assertEqual(fn.makeSerie(fn.serieDefFromString("1-2x4")), [1, -1, -3, -5, -7], "Series 1-2x4");
            assertEqual(fn.makeSerie(fn.serieDefFromString("1x4")), [1, 1, 1, 1, 1], "Series 1x4 (1 then 4 more 1s)");
            assertEqual(fn.makeSerie(fn.serieDefFromString("_x4")), ['_', '_', '_', '_', '_'], "Series _x4 (_ then 4 more _s)");
            assertEqual(fn.makeSerie(fn.serieDefFromString("#+1x1")), [0, 1], "Series starting with # (defaults to 0)"); // Assuming # defaults to 0 if no prior
          //assertEqual(fn.makeSerie(fn.serieDefFromString("5 #+1x1")), [5, 5, 6], "Series with # after a number");
          //assertEqual(fn.makeSerie(fn.serieDefFromString("1 _ #+1x1")), [1, "_", 0, 1], "Series with # after special (defaults to 0)");
            assertEqual(fn.makeSerie(fn.serieDefFromString("0.5+0.1x2")), [0.5, 0.6, 0.7], "Decimal series 0.5+0.1x2");
        }

        function testMakeSerieConstant() {
            console.log("\n-- Testing fn.makeSerieConstant --");
            assertEqual(fn.makeSerieConstant(5, 3), [5, 5, 5], "Constant series 5, 3 steps");
            assertEqual(fn.makeSerieConstant(0, 1), [0], "Constant series 0, 1 step");
        }

        function testRateOverN() {
            console.log("\n-- Testing fn.rateOverN --");
             // Assuming fn.makeSerie is correct for generating test data
            const testSerie = fn.makeSerie(fn.serieDefFromString("0+1x4")); // [0,1,2,3,4]
            assertEqual(fn.rateOverN(testSerie, 1), [0,1,1,1,1], "rateOverN N=1");
            assertEqual(fn.rateOverN(testSerie, 2), [0,0.5,1,1,1], "rateOverN N=2");
        }

        function testProportionRateOverN() {
            console.log("\n-- Testing fn.proportionRateOverN --");
            const badSerie = fn.makeSerie(fn.serieDefFromString("0+1x4")); // [0,1,2,3,4]
            const goodSerie = fn.makeSerie(fn.serieDefFromString("0+0x4"));// [0,0,0,0,0]
            // Expected: [0, 1, 1, 1, 1] (bad / (bad+good))
            assertEqual(fn.proportionRateOverN(badSerie, goodSerie, 1), [0,1,1,1,1], "proportionRateOverN N=1, only bad events");
        }

        function testSumOverN() {
            console.log("\n-- Testing fn.sumOverN --");
            const testSerie = fn.makeSerie(fn.serieDefFromString("1+0x4")); // [1,1,1,1,1]
            assertEqual(fn.sumOverN(testSerie, 2), [1,1,0,0,0], "sumOverN N=2");
        }

        // Add more test functions for indexOfValueOver, seriesOverThreshold

        testSerieDefFromString();
        testMakeSerie();
        testMakeSerieConstant();
        testRateOverN();
        testProportionRateOverN();
        testSumOverN();
        // Call other test functions here

        console.log(`\n--- Test Summary ---`);
        console.log(`Total tests run: ${testsRun}`);
        console.log(`Tests passed: ${testsPassed}`);
        console.log(`Tests failed: ${testsRun - testsPassed}`);
        if (allTestsPassed) {
            console.log("%cAll Unit Tests Passed!", "color: green; font-size: 18px; font-weight: bold;");
        } else {
            console.error("%cSome Unit Tests Failed.", "color: red; font-size: 18px; font-weight: bold;");
        }
    }
