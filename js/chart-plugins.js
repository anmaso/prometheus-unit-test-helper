// Chart.js plugins for SLO Unit Test Helper

export const highlightPlugin = {
  id: "highlight",
  beforeDraw: (chart) => {
    // Check if the plugin is enabled via chart options
    if (!chart.options?.plugins?.highlight?.enabled) {
      return;
    }

    const { ctx, chartArea, data, scales } = chart;
    if (!chartArea || !data || !scales.x) { // Ensure essential components are available
      return;
    }

    const datasets = data.datasets;
    if (!datasets.length){ 
     return
    }
    const alert1Dataset = datasets.find(ds => ds.label === 'alert1');
    const alert2Dataset = datasets.find(ds => ds.label === 'alert2');
    const threshold1Dataset = datasets.find(ds => ds.label === 'threshold1');
    const threshold2Dataset = datasets.find(ds => ds.label === 'threshold2');

    const alert1Data = alert1Dataset.data;
    const alert2Data = alert2Dataset.data;
    const threshold1Data = threshold1Dataset.data;
    const threshold2Data = threshold2Dataset.data;

    // Determine the number of points to check, limited by the shortest series
    const numPoints = Math.min(alert1Data.length, alert2Data.length, threshold1Data.length);
    if (numPoints === 0) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(180, 85, 85, 0.6)"; // A semi-transparent orange for highlighting

    let inHighlightSegment = false;
    let segmentStartIndex = 0;
    const debounceSteps = parseInt(chart.debounceTime, 10) || 0;

    let effectiveAlertStates = new Array(numPoints).fill(false);
    let consecutiveOverThreshold = 0;

    for (let i = 0; i < numPoints; i++) {
      const isOverThreshold = alert1Data[i] > threshold1Data[i] && alert2Data[i] > threshold2Data[i];

      if (isOverThreshold && !inHighlightSegment) {
        consecutiveOverThreshold++;
        if (consecutiveOverThreshold >= debounceSteps) {
          inHighlightSegment = true;
          segmentStartIndex = i;
        }
      } else if (!isOverThreshold && inHighlightSegment) {
        if (consecutiveOverThreshold>=debounceSteps){
          const xPixelStart = scales.x.getPixelForValue(segmentStartIndex);
          const xPixelEnd = scales.x.getPixelForValue(i); // Segment is [segmentStartIndex, i-1]
          ctx.fillRect(xPixelStart, chartArea.top, xPixelEnd - xPixelStart, chartArea.bottom - chartArea.top);
        }
        inHighlightSegment = false;
        consecutiveOverThreshold=0;
      }
    }

    // If the loop finishes and we are still in a highlight segment
    if (inHighlightSegment) {
      const xPixelStart = scales.x.getPixelForValue(segmentStartIndex);
      const xPixelEnd = scales.x.getPixelForValue(numPoints); // Highlight till the end of the last valid point's bar
      ctx.fillRect(xPixelStart, chartArea.top, xPixelEnd - xPixelStart, chartArea.bottom - chartArea.top);
    }

    ctx.restore();
  },
}; 