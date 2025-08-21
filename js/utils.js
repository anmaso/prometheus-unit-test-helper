// Utility functions for SLO Unit Test Helper
export const fn = {
  serieDefFromString: (definition) => {
    const parts = definition.trim().split(/\s+/).filter(p => p !== "");
    const seriesSpec = [];

    // Regex for initialValue, operator (+ or -), incrementValue, stepsValue
    // Examples: -2+4x3, 1-2x4, #+1x5
    const opRegex = /^([#]|-?\d*\.?\d+)([+-])(\d*\.?\d+)x(\d+)$/;

    // Regex for initialValue, stepsValue (for numeric shorthand or special repeats)
    // Examples: 1x4 (numeric), _x3 (special),  #x2 (numeric repeat)
    const repeatRegex = /^([#\w_.-]+)x(\d+)$/;

    const numericLiteralRegex = /^[+-]?\d+(\.\d+)?$/;

    for (const p of parts) {
      let match;

      if ((match = p.match(opRegex))) {
        // Handles 'a+bxn', 'a-bxn', '#+bxn'
        const initial = match[1] === "#" ? "#" : parseFloat(match[1]);
        const operator = match[2];
        const increment = parseFloat(match[3]);
        const steps = parseInt(match[4], 10); // n further samples
        seriesSpec.push({
          initial: initial,
          increment: operator === '-' ? -increment : increment,
          steps: steps // n further samples
        });
      } else if ((match = p.match(repeatRegex))) {
        // Handles 'axn' (numeric shorthand) and '_xn', '#xn' (numeric repeat)
        const valueStr = match[1];
        const n = parseInt(match[2], 10);

        if (valueStr === "_") {
          // '_xn' -> n repetitions of '_'
          seriesSpec.push({ initial: '_', increment: '_', steps: n });
        } else if (valueStr === "#") {
          // '#xn' -> '#' then n further instances of that value (effectively repeating last numeric value n+1 times)
          seriesSpec.push({ initial: '#', increment: 0, steps: n });
        } else if (numericLiteralRegex.test(valueStr)) {
          // Numeric 'axn' -> 'a+0xn' (a then n further 'a's)
          seriesSpec.push({ initial: parseFloat(valueStr), increment: 0, steps: n, });
        } else {
          console.warn(`Unrecognized value in repeat segment: ${p}. Treating as ${n} repetitions of literal "${valueStr}".`);
          seriesSpec.push({ initial: valueStr, type: 'special_repeat', steps: n });
        }
      } else if (p === "#") {
        seriesSpec.push({ initial: "#", increment: 0, steps: 0 }); // Single '#'
      } else if (p === "_") {
        seriesSpec.push({ initial: "_", increment: '_', steps: 0 });
      } else if (numericLiteralRegex.test(p)) {
        seriesSpec.push({ initial: parseFloat(p),  increment: 0, steps: 0 }); // Single number
      } else {
        console.warn(`Unrecognized segment: ${p} in definition ${definition}. Treating as a single literal string.`);
        seriesSpec.push({ initial: p, type: 'special_single' }); // Treat unknown as single special
      }
    }
    return seriesSpec;
  },

  makeSerieConstant: (value, steps) =>
    fn.makeSerie([{
      initial: value,
      increment: 0,
      steps:steps-1,
    }]),

  makeSerie: (spec) => {
    let values = [];
    spec.forEach((s) => {
      let len = values.length;
      if (s.initial == "#") {
        if (len==0){
          values = [0];
        }else{
          let lastValue = values[values.length - 1];
          if (isNaN(lastValue)) {
            lastValue = 0;
          }
          values.push(lastValue + s.increment);
        }
      } else {
        if (s.initial === '_') {
          // Handle special underscore values directly
          values.push(s.initial);
        } else {
          // For separate series definitions, use the initial value directly
          values.push(s.initial);
        }
      }
      for (let i = 0; i < s.steps; i++) {
        if (s.increment=='_'){
          values.push(s.increment)
        }else{
          values.push(values[values.length - 1] + s.increment);
        }
      }
    });
    return values;
  },

  rateOverN: (serie,N) => {
    let values = new Array(serie.length).fill(0);
    for (let i = 0; i < serie.length; i++) {
      values[i] =
        (i >= N ? serie[i] - serie[i - N] : serie[i])/N
      if (values[i] < 0) values[i] = 0;
    }
    return values;
  },

  proportionRateOverN: (bad, good, N) => {
    let max = bad.length >= good.length ? bad.length : good.length;
    let values = new Array(max).fill(0);
    for (let i = 0; i < max; i++) {
      let goodDelta =
        i < good.length ? (i >= N ? ((good[i] - good[i - N])>=0?good[i] - good[i - N]:good[i]) : good[i]) : 0;
      let badDelta =
        i < bad.length ? (i >= N ? ((bad[i] - bad[i - N])>=0?bad[i] - bad[i - N]:bad[i]) : bad[i]) : 0;
      if (goodDelta === 0 &&  badDelta == 0){
        values[i] = 0;
      }else{
        values[i] = badDelta / (badDelta + goodDelta);
      }
    }
    return values;
  },

  sumOverN: (serie, N) => {
    if (N <= 0) N = 1; // Ensure N is at least 1
    let values = new Array(serie.length).fill(0);
    let currentSum = 0;
    for (let i = 0; i < serie.length; i++) {
      currentSum = serie[i] || 0; // Add current element, ensuring it's a number
      if (i >= N) {
        currentSum -= serie[i - N] || 0; // Subtract element that falls out of window
      }
      if (currentSum>0){
        values[i] = currentSum;
      }
    }
    return values;
  },

  // Parse interval string to minutes (e.g., "1m" -> 1, "5m" -> 5, "1h" -> 60, "30s" -> 0.5)
  parseIntervalToMinutes: (intervalString) => {
    const match = intervalString.match(/^(\d+(?:\.\d+)?)(s|m|h|d)$/);
    if (!match) {
      console.warn(`Invalid interval format: ${intervalString}. Using 1m as default.`);
      return 1;
    }
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value / 60; // seconds to minutes
      case 'm': return value; // minutes
      case 'h': return value * 60; // hours to minutes
      case 'd': return value * 1440; // days to minutes (24 * 60)
      default: return 1;
    }
  },

  // Convert step number to time string based on interval
  stepToTimeString: (step, interval) => {
    const intervalInMinutes = fn.parseIntervalToMinutes(interval);
    const totalMinutes = step * intervalInMinutes;
    
    if (totalMinutes < 0) return '0m';
    
    const days = Math.floor(totalMinutes / 1440); // 24 * 60 = 1440 minutes per day
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const mins = Math.floor(totalMinutes % 60);
    const secs = Math.floor((totalMinutes % 1) * 60);
    
    let result = '';
    if (days > 0) result += days + 'd';
    if (hours > 0) result += hours + 'h';
    if (mins > 0) result += mins + 'm';
    if (secs > 0 && totalMinutes < 60) result += secs + 's'; // Only show seconds if total is less than 1 hour
    if (result === '') result = '0m';
    
    return result;
  },

  // Convert minutes to days, hours, minutes string representation (legacy function)
  minutesToTimeString: (minutes) => {
    if (minutes < 0) return '0m';
    
    const days = Math.floor(minutes / 1440); // 24 * 60 = 1440 minutes per day
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    
    let result = '';
    if (days > 0) result += days + 'd';
    if (hours > 0) result += hours + 'h';
    if (mins > 0 || result === '') result += mins + 'm';
    
    return result;
  },

  indexOfValueOver: (threshold, series1, series2) => {
    let overThreshold = -1;
    let returnToGood = -1;
    for (let i = 0; i < series1.length; i++) {
      if (overThreshold < 0) {
        if (series1[i] > threshold && (!series2 || series2[i] > threshold)) {
          overThreshold = i;
        }
      } else {
        if (series1[i] <= threshold && (!series2 || series2[i] <= threshold)) {
          returnToGood = i;
          return `${overThreshold} - ${returnToGood}`;
        }
      }
    }
    return `${overThreshold} - ${returnToGood}`;
  },

  seriesOverThreshold: (threshold, series1, series2) => {
    const results = [];
    if (!series1 || series1.length === 0) {
      return results;
    }

    let startIndex = -1;
    const N = series1.length;

    for (let i = 0; i < N; i++) {
      const s1Value = series1[i];
      let currentIsOverThreshold;

      if (series2) {
        // If series2 is provided, both series must be over the threshold.
        // This also implicitly handles cases where series2 might be shorter than series1,
        // as (i < series2.length) will become false.
        currentIsOverThreshold = s1Value > threshold && i < series2.length && series2[i] > threshold;
      } else {
        // If series2 is not provided, only series1 matters.
        currentIsOverThreshold = s1Value > threshold;
      }

      if (currentIsOverThreshold) {
        if (startIndex === -1) { // Start of a new range
          startIndex = i;
        }
      } else {
        if (startIndex !== -1) { // End of the current range
          results.push([startIndex, i - 1]);
          startIndex = -1;
        }
      }
    }

    // If the loop finishes and we are still in a range (startIndex !== -1)
    if (startIndex !== -1) {
      results.push([startIndex, N - 1]);
    }

    return results;
  },

  expandSeriesDefinition: (definition) => {
    const spec = fn.serieDefFromString(definition);
    const expandedParts = [];
    let lastValue = 0;

    spec.forEach((s) => {
      let initialValue;
      if (s.initial === "#") {
        initialValue = lastValue;
      } else if (typeof s.initial === 'number') {
        initialValue = s.initial;
      } else {
        // For special values like '_', keep them as is
        expandedParts.push(s.initial);
        return;
      }

      if (s.steps === 0) {
        // Single value
        expandedParts.push(initialValue.toString());
        lastValue = initialValue;
      } else {
        // Value with increment and steps
        const operator = s.increment >= 0 ? '+' : '';
        expandedParts.push(`${initialValue}${operator}${s.increment}x${s.steps}`);
        // Calculate the last value for this segment
        lastValue = initialValue + (s.increment * s.steps);
      }
    });

    return expandedParts.join(' ');
  },
}; 