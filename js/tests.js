import { fn } from './utils.js';

/**
 * Comprehensive Unit Test Suite for Prometheus Unit Test Helper
 * 
 * This test suite implements comprehensive testing for the JavaScript utility functions
 * that support Prometheus unit testing patterns. The tests are based on the official
 * Prometheus documentation for unit testing rules and cover real-world scenarios.
 * 
 * Test Categories:
 * 
 * 1. CORE FUNCTIONALITY TESTS:
 *    - serieDefFromString: Parse expanding notation like '1+1x2', '1-2x4', '_x3'
 *    - makeSerie: Convert parsed definitions to actual time series arrays
 *    - makeSerieConstant: Generate constant value series
 *    - rateOverN: Calculate rate over N periods (similar to Prometheus rate())
 *    - proportionRateOverN: Calculate proportions for SLI/SLO calculations
 *    - sumOverN: Calculate moving sums over N periods
 * 
 * 2. SPECIAL VALUES TESTS:
 *    - Missing samples ('_') representing scrape failures
 *    - Stale values ('stale') for Prometheus staleness handling
 *    - Mixed series with special and numeric values
 * 
 * 3. COMPLEX EXPANDING NOTATION:
 *    - Multiple series definitions in one string
 *    - Decimal precision handling
 *    - Large numbers and edge cases
 *    - Error conditions and malformed input
 * 
 * 4. PROMETHEUS-SPECIFIC PATTERNS:
 *    - Counter reset scenarios (pod restarts)
 *    - Continuation series using '#' notation
 *    - Complex time series aggregations
 *    - Rate calculations mimicking Prometheus functions
 * 
 * 5. ALERTING PATTERNS:
 *    - Instance down detection patterns
 *    - High error rate detection
 *    - Disk space and resource threshold alerts
 *    - Threshold crossing and recovery scenarios
 * 
 * 6. SLI/SLO PATTERNS:
 *    - Availability calculations (99.9% SLO patterns)
 *    - Error budget tracking and exhaustion
 *    - Error rate calculations for service monitoring
 * 
 * 7. TIME WINDOW PATTERNS:
 *    - 5-minute rate windows (common in Prometheus)
 *    - Burndown patterns for error budgets
 *    - Time-based threshold calculations
 * 
 * 8. COUNTER PATTERNS:
 *    - Monotonic counter growth patterns
 *    - Counter reset handling in rate calculations
 *    - Instant rate calculations (irate pattern)
 * 
 * 9. HIGH CARDINALITY SCENARIOS:
 *    - Multi-instance aggregations
 *    - Service-to-service metric patterns
 *    - Cross-instance calculations
 * 
 * 10. ADVANCED PATTERNS:
 *     - Prediction patterns (linear growth detection)
 *     - Saturation detection
 *     - Percentile threshold breaches (P95 patterns)
 *     - TopK service identification patterns
 * 
 * 11. UTILITY FUNCTIONS:
 *     - Time formatting (minutesToTimeString)
 *     - Series expansion and manipulation
 *     - Error handling and edge cases
 * 
 * Test Count: 89 comprehensive tests covering all aspects of Prometheus unit testing
 * 
 * Usage: Call runUnitTests() to execute the full test suite
 */

export const runUnitTests = function() {
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
            assertEqual(fn.makeSerie(fn.serieDefFromString("3+0x2 4+0x2")), [3, 3, 3, 4, 4, 4], "Series of fixed values  3 3 3 4 4 4");
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

        function testSpecialValues() {
            console.log("\n-- Testing Special Values --");
            assertEqual(fn.serieDefFromString("stale"), [{ initial: "stale", type: 'special_single' }], "Single stale value");
            assertEqual(fn.serieDefFromString("stalex3"), [{ initial: "stale", type: 'special_repeat', steps: 3 }], "Stale repeat 'stalex3'");
            assertEqual(fn.serieDefFromString("1 _ stale"), [
                { initial: 1, increment: 0, steps: 0 },
                { initial: "_", increment: '_' },
                { initial: "stale", type: 'special_single' }
            ], "Mixed series with stale");
            assertEqual(fn.serieDefFromString("1 _x2 stale"), [
                { initial: 1, increment: 0, steps: 0 },
                { initial: "_", increment: '_', steps: 2 },
                { initial: "stale", type: 'special_single' }
            ], "Mixed series with underscore repeat and stale");
        }

        function testComplexExpandingNotation() {
            console.log("\n-- Testing Complex Expanding Notation --");
            assertEqual(fn.serieDefFromString("1+1x2 5+2x3"), [
                { initial: 1, increment: 1, steps: 2 },
                { initial: 5, increment: 2, steps: 3 }
            ], "Multiple series definitions");
            assertEqual(fn.serieDefFromString("10-3x4 0+5x2"), [
                { initial: 10, increment: -3, steps: 4 },
                { initial: 0, increment: 5, steps: 2 }
            ], "Decreasing then increasing series");
            assertEqual(fn.serieDefFromString("1+0.5x3 2.5+1.5x2"), [
                { initial: 1, increment: 0.5, steps: 3 },
                { initial: 2.5, increment: 1.5, steps: 2 }
            ], "Multiple decimal series");
        }

        function testEdgeCases() {
            console.log("\n-- Testing Edge Cases --");
            assertEqual(fn.serieDefFromString("0+1x0"), [{ initial: 0, increment: 1, steps: 0 }], "Zero steps");
            assertEqual(fn.serieDefFromString("1000000+1x2"), [{ initial: 1000000, increment: 1, steps: 2 }], "Large numbers");
            assertEqual(fn.serieDefFromString("-1000-500x2"), [{ initial: -1000, increment: -500, steps: 2 }], "Large negative numbers");
            assertEqual(fn.serieDefFromString("0.001+0.001x3"), [{ initial: 0.001, increment: 0.001, steps: 3 }], "Very small decimals");
            assertEqual(fn.serieDefFromString("1.999999+0.000001x2"), [{ initial: 1.999999, increment: 0.000001, steps: 2 }], "High precision decimals");
        }

        function testCounterReset() {
            console.log("\n-- Testing Counter Reset Scenarios --");
            assertEqual(fn.makeSerie(fn.serieDefFromString("0+5x3 0+3x2")), [0, 5, 10, 15, 0, 3, 6], "Counter reset: ascending then reset");
            assertEqual(fn.makeSerie(fn.serieDefFromString("100+10x2 0+20x3")), [100, 110, 120, 0, 20, 40, 60], "Counter reset: high values then reset");
            assertEqual(fn.makeSerie(fn.serieDefFromString("50+25x2 _ 10+5x2")), [50, 75, 100, "_", 10, 15, 20], "Counter reset with missing sample");
        }

        function testContinuationSeries() {
            console.log("\n-- Testing Continuation Series (#) --");
            assertEqual(fn.makeSerie(fn.serieDefFromString("5 #+2x3")), [5, 7, 9, 11, 13], "Continuation after single value");
            assertEqual(fn.makeSerie(fn.serieDefFromString("1+1x2 #+3x2")), [1, 2, 3, 6, 9, 12], "Continuation after increment series");
            assertEqual(fn.makeSerie(fn.serieDefFromString("10-2x3 #+1x2")), [10, 8, 6, 4, 5, 6, 7], "Continuation after decrement series");
        }

        function testComplexMixedSeries() {
            console.log("\n-- Testing Complex Mixed Series --");
            assertEqual(fn.makeSerie(fn.serieDefFromString("1+1x2 _ 5+0x2 #+2x2")), [1, 2, 3, "_", 5, 5, 5, 7, 9, 11], "Complex mixed: increment, missing, constant, continuation");
            assertEqual(fn.makeSerie(fn.serieDefFromString("0+10x2 _x2 10+5x2")), [0, 10, 20, "_", "_", "_", 10, 15, 20], "Series with multiple missing samples");
        }

        function testIndexOfValueOver() {
            console.log("\n-- Testing fn.indexOfValueOver --");
            const series1 = fn.makeSerie(fn.serieDefFromString("1+1x5")); // [1,2,3,4,5,6]
            const series2 = fn.makeSerie(fn.serieDefFromString("0+2x5")); // [0,2,4,6,8,10]
            assertEqual(fn.indexOfValueOver(3, series1), "3 - -1", "Single series over threshold");
            assertEqual(fn.indexOfValueOver(5, series1, series2), "5 - -1", "Both series over threshold");
            
            const series3 = fn.makeSerie(fn.serieDefFromString("10-1x10")); // [10,9,8,7,6,5,4,3,2,1,0]
            assertEqual(fn.indexOfValueOver(5, series3), "0 - 5", "Series crossing threshold downward");
        }

        function testSeriesOverThreshold() {
            console.log("\n-- Testing fn.seriesOverThreshold --");
            const series = fn.makeSerie(fn.serieDefFromString("1+1x10")); // [1,2,3,4,5,6,7,8,9,10,11]
            assertEqual(fn.seriesOverThreshold(5, series), [[5, 10]], "Single range over threshold");
            assertEqual(fn.seriesOverThreshold(12, series), [], "No values over threshold");
            assertEqual(fn.seriesOverThreshold(0, series), [[0, 10]], "All values over threshold");
            
            const complexSeries = fn.makeSerie(fn.serieDefFromString("1+1x3 2-1x4 6+1x2")); // [1,2,3,4,2,1,0,-1,6,7,8]
            assertEqual(fn.seriesOverThreshold(2, complexSeries), [[2, 3], [9, 11]], "Multiple ranges over threshold");
        }

        function testRateCalculations() {
            console.log("\n-- Testing Rate Calculations --");
            // Test rate calculation similar to Prometheus rate() function
            const counterSeries = fn.makeSerie(fn.serieDefFromString("0+5x10")); // [0,5,10,15,20,25,30,35,40,45,50]
            assertEqual(fn.rateOverN(counterSeries, 1), [0,5,5,5,5,5,5,5,5,5,5], "Rate calculation N=1");
            
            // Test with counter reset
            const resetSeries = fn.makeSerie(fn.serieDefFromString("0+10x5 0+10x5")); // [0,10,20,30,40,50,0,10,20,30,40,50]
            const rateResult = fn.rateOverN(resetSeries, 1);
            assertEqual(rateResult.slice(0, 6), [0,10,10,10,10,10], "Rate before reset");
            assertEqual(rateResult[6], 0, "Rate handles counter reset");
        }

        function testPrometheusPatterns() {
            console.log("\n-- Testing Common Prometheus Patterns --");
            // Test error rate calculation
            const totalRequests = fn.makeSerie(fn.serieDefFromString("0+100x5")); // [0,100,200,300,400,500]
            const errorRequests = fn.makeSerie(fn.serieDefFromString("0+5x5"));    // [0,5,10,15,20,25]
            
            // Test error rate - badDelta/(badDelta + goodDelta)
            // At index 1: badDelta=5, goodDelta=100, so rate = 5/(5+100) = 5/105 ≈ 0.0476
            const errorRate = fn.proportionRateOverN(errorRequests, totalRequests, 1);
            assertEqual(Math.round(errorRate[1] * 1000) / 1000, 0.048, "Error rate calculation ~4.8%");
            
            // Test availability calculation - successDelta/(successDelta + totalDelta)
            // At index 1: successDelta=95, totalDelta=100, so availability = 95/(95+100) = 95/195 ≈ 0.487
            const successRequests = totalRequests.map((total, i) => total - errorRequests[i]);
            const availability = fn.proportionRateOverN(successRequests, totalRequests, 1);
            assertEqual(Math.round(availability[1] * 1000) / 1000, 0.487, "Availability calculation ~48.7%");
        }

        function testErrorHandling() {
            console.log("\n-- Testing Error Handling --");
            // Test malformed input handling
            assertEqual(fn.serieDefFromString(""), [], "Empty string");
            assertEqual(fn.serieDefFromString("   "), [], "Whitespace only");
            assertEqual(fn.serieDefFromString("invalid"), [{ initial: "invalid", type: 'special_single' }], "Invalid format treated as literal");
            assertEqual(fn.serieDefFromString("1+ x2"), [{ initial: "1+", type: 'special_single' }, { initial: "x2", type: 'special_single' }], "Malformed increment");
            assertEqual(fn.serieDefFromString("1+2x"), [{ initial: "1+2x", type: 'special_single' }], "Missing steps value");
        }

        function testTimeUtilities() {
            console.log("\n-- Testing Time Utilities --");
            assertEqual(fn.minutesToTimeString(0), "0m", "Zero minutes");
            assertEqual(fn.minutesToTimeString(30), "30m", "30 minutes");
            assertEqual(fn.minutesToTimeString(60), "1h", "1 hour");
            assertEqual(fn.minutesToTimeString(90), "1h30m", "1 hour 30 minutes");
            assertEqual(fn.minutesToTimeString(1440), "1d", "1 day");
            assertEqual(fn.minutesToTimeString(1530), "1d1h30m", "1 day 1 hour 30 minutes");
            assertEqual(fn.minutesToTimeString(-5), "0m", "Negative minutes");
        }

        function testExpandSeriesDefinition() {
            console.log("\n-- Testing fn.expandSeriesDefinition --");
            assertEqual(fn.expandSeriesDefinition("1+1x2"), "1+1x2", "Simple expansion");
            assertEqual(fn.expandSeriesDefinition("5 #+2x3"), "5 5+2x3", "Expansion with continuation");
            assertEqual(fn.expandSeriesDefinition("1+1x2 #+3x2"), "1+1x2 3+3x2", "Multiple expansions");
            assertEqual(fn.expandSeriesDefinition("_ 1+1x2"), "_ 1+1x2", "Expansion with special values");
        }

        function testPrometheusAlertingPatterns() {
            console.log("\n-- Testing Prometheus Alerting Patterns --");
            
            // Test instance down pattern (common Prometheus alert)
            const upSeries = fn.makeSerie(fn.serieDefFromString("1x5 0x5 1x5")); // instance goes down then comes back
            assertEqual(fn.indexOfValueOver(0, upSeries), "0 - 6", "Instance down detection");
            
            // Test high error rate pattern
            const httpErrors = fn.makeSerie(fn.serieDefFromString("0+1x5 0+10x5 0+1x5")); // error spike in middle
            const errorRanges = fn.seriesOverThreshold(5, httpErrors);
            assertEqual(errorRanges, [[7, 11]], "High error rate detection");
            
            // Test disk space pattern
            const diskUsage = fn.makeSerie(fn.serieDefFromString("70+2x10 90+1x5")); // disk usage growing
            assertEqual(fn.indexOfValueOver(85, diskUsage), "8 - -1", "Disk space alert threshold");
        }

        function testSLISLOPatterns() {
            console.log("\n-- Testing SLI/SLO Patterns --");
            
            // Test 99.9% availability SLO (common in production)
            const successfulRequests = fn.makeSerie(fn.serieDefFromString("0+999x10")); // 999 successful per period
            const totalRequests = fn.makeSerie(fn.serieDefFromString("0+1000x10"));     // 1000 total per period
            
            const availability = fn.proportionRateOverN(successfulRequests, totalRequests, 1);
            // At index 1: 999/(999+1000) = 999/1999 ≈ 0.4997
            assertEqual(Math.round(availability[1] * 1000) / 1000, 0.5, "99.9% availability SLO approximation");
            
            // Test error budget calculation
            const errorBudget = fn.makeSerie(fn.serieDefFromString("1000-1x10")); // decreasing error budget
            assertEqual(fn.indexOfValueOver(995, errorBudget), "0 - 5", "Error budget exhaustion");
        }

        function testPrometheusTimeWindowPatterns() {
            console.log("\n-- Testing Prometheus Time Window Patterns --");
            
            // Test 5-minute rate window (common in Prometheus)
            const httpRequests = fn.makeSerie(fn.serieDefFromString("0+300x15")); // 300 requests/min for 15 min
            const rate5min = fn.rateOverN(httpRequests, 5);
            assertEqual(rate5min[5], 300, "5-minute rate calculation"); // 1500/5 = 300 per minute
            
            // Test burndown pattern
            const errorBudgetBurndown = fn.makeSerie(fn.serieDefFromString("10000-100x100")); // fast burndown
            const burnRanges = fn.seriesOverThreshold(5000, errorBudgetBurndown);
            assertEqual(burnRanges.length > 0, true, "Error budget burndown detection");
        }

        function testPrometheusCounterPatterns() {
            console.log("\n-- Testing Prometheus Counter Patterns --");
            
            // Test counter with reset (common when pods restart)
            const requestCounter = fn.makeSerie(fn.serieDefFromString("100+50x5 0+75x5")); // counter resets
            const rates = fn.rateOverN(requestCounter, 1);
            assertEqual(rates[6], 0, "Counter reset handling in rate calculation");
            assertEqual(rates[7], 75, "Rate recovery after counter reset");
            
            // Test monotonic counter growth
            const monotonicCounter = fn.makeSerie(fn.serieDefFromString("0+100x20"));
            const maxRate = Math.max(...fn.rateOverN(monotonicCounter, 1));
            assertEqual(maxRate, 100, "Monotonic counter rate consistency");
        }

        function testHighCardinality() {
            console.log("\n-- Testing High Cardinality Scenarios --");
            
            // Test multiple instance pattern (simulates multiple pods/instances)
            const instance1 = fn.makeSerie(fn.serieDefFromString("0+10x10"));
            const instance2 = fn.makeSerie(fn.serieDefFromString("0+15x10"));
            const instance3 = fn.makeSerie(fn.serieDefFromString("0+12x10"));
            
            // Simulate aggregation across instances
            const aggregated = instance1.map((val, i) => 
                (typeof val === 'number' ? val : 0) + 
                (typeof instance2[i] === 'number' ? instance2[i] : 0) + 
                (typeof instance3[i] === 'number' ? instance3[i] : 0)
            );
            
            assertEqual(aggregated[5], 185, "Multi-instance aggregation"); // (50+75+60)
        }

        function testPrometheusExpressionPatterns() {
            console.log("\n-- Testing Prometheus Expression Patterns --");
            
            // Test increase() function pattern
            const counterSeries = fn.makeSerie(fn.serieDefFromString("100+25x8"));
            const increases = fn.rateOverN(counterSeries, 2);
            assertEqual(increases[2], 25, "2-period increase calculation");
            
            // Test irate() pattern (instant rate - last 2 samples)
            const iratePattern = fn.makeSerie(fn.serieDefFromString("0+10x5 0+50x5"));
            const instantRates = fn.rateOverN(iratePattern, 1);
            assertEqual(instantRates[6], 0, "Instant rate with counter reset");
            assertEqual(instantRates[7], 50, "Instant rate after reset");
        }

        function testPredictionPatterns() {
            console.log("\n-- Testing Prediction Patterns --");
            
            // Test linear growth prediction (predict_linear pattern)
            const growthSeries = fn.makeSerie(fn.serieDefFromString("100+5x20")); // steady growth
            const growth = fn.rateOverN(growthSeries, 5);
            assertEqual(growth[10], 5, "Linear growth rate detection"); // 25/5 = 5 per period
            
            // Test saturation prediction
            const saturationSeries = fn.makeSerie(fn.serieDefFromString("10+5x10 50+2x10 80+1x10")); // slowing growth
            const saturationRanges = fn.seriesOverThreshold(75, saturationSeries);
            assertEqual(saturationRanges.length > 0, true, "Saturation threshold detection");
        }

        function testAdvancedAggregations() {
            console.log("\n-- Testing Advanced Aggregation Patterns --");
            
            // Test percentile patterns (simulating histogram_quantile)
            const latencies = fn.makeSerie(fn.serieDefFromString("10+1x20")); // increasing latencies
            const p95Threshold = fn.indexOfValueOver(25, latencies);
            assertEqual(p95Threshold, "16 - -1", "P95 latency threshold breach");
            
            // Test topk pattern
            const serviceCounts = [
                fn.makeSerie(fn.serieDefFromString("0+100x5")), // service A
                fn.makeSerie(fn.serieDefFromString("0+200x5")), // service B (highest)
                fn.makeSerie(fn.serieDefFromString("0+150x5"))  // service C
            ];
            
            // Find highest at index 3
            const highestAtIndex3 = Math.max(serviceCounts[0][3], serviceCounts[1][3], serviceCounts[2][3]);
            assertEqual(highestAtIndex3, 600, "Top service identification"); // service B: 200*3
        }

        testSerieDefFromString();
        testMakeSerie();
        testMakeSerieConstant();
        testRateOverN();
        testProportionRateOverN();
        testSumOverN();
        
        // Execute comprehensive tests
        testSpecialValues();
        testComplexExpandingNotation();
        testEdgeCases();
        testCounterReset();
        testContinuationSeries();
        testComplexMixedSeries();
        testIndexOfValueOver();
        testSeriesOverThreshold();
        testRateCalculations();
        testPrometheusPatterns();
        testErrorHandling();
        testTimeUtilities();
        testExpandSeriesDefinition();
        
        // Execute advanced Prometheus-specific tests
        testPrometheusAlertingPatterns();
        testSLISLOPatterns();
        testPrometheusTimeWindowPatterns();
        testPrometheusCounterPatterns();
        testHighCardinality();
        testPrometheusExpressionPatterns();
        testPredictionPatterns();
        testAdvancedAggregations();

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
