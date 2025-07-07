import { fn } from './utils.js';
import { ChartComponent } from './chart-component.js';
import { highlightPlugin } from './chart-plugins.js';

// Make highlightPlugin available globally for ChartComponent
window.highlightPlugin = highlightPlugin;

// Main Vue app
export function createApp() {
  const { createApp } = Vue;
  
  const app = createApp({
    methods: {
    },
    setup() {
      // localStorage keys
      const LS_KEYS = {
        BAD: 'slo_helper_bad_v1',
        GOOD: 'slo_helper_good_v1',
        SHORT: 'slo_helper_short_v1',
        LONG: 'slo_helper_long_v1',
        THRESHOLD1: 'slo_helper_threshold1_v1',
        THRESHOLD2: 'slo_helper_threshold2_v1',
        HIGHLIGHT_ENABLED: 'slo_helper_highlight_enabled_v1',
        SELECTED_FORMULA: 'slo_helper_selected_formula_v1',
        DEBOUNCE_ENABLED: 'slo_helper_debounce_enabled_v1', 
        DEBOUNCE_TIME: 'slo_helper_debounce_time_v1',
        SHOW_SERIES_VALUES: 'slo_helper_show_series_values_v1',
        SHOW_TIME_FORMAT: 'slo_helper_show_time_format_v1'
      };

      const initialGood = localStorage.getItem(LS_KEYS.GOOD) || "0+1000x60 #+850x10 #+1000x60 #+0x60 #+850x10 #+1000x60";
      const initialBad = localStorage.getItem(LS_KEYS.BAD) || "0+0x60 150+150x10 #+0x60 #+0x60 #+150x10 #+0x60";
      const initialShort = localStorage.getItem(LS_KEYS.SHORT) || 0;
      const initialLong = localStorage.getItem(LS_KEYS.LONG) || 0;
      const initialThreshold1 = localStorage.getItem(LS_KEYS.THRESHOLD1) || 0;
      const initialThreshold2 = localStorage.getItem(LS_KEYS.THRESHOLD2) || 0;
      const initialSelectedFormula = localStorage.getItem(LS_KEYS.SELECTED_FORMULA) || 'proportionRateOverN';
      const initialHighlightEnabled = localStorage.getItem(LS_KEYS.HIGHLIGHT_ENABLED);
      const initialDebounceEnabled = localStorage.getItem(LS_KEYS.DEBOUNCE_ENABLED);
      const initialDebounceTime = localStorage.getItem(LS_KEYS.DEBOUNCE_TIME) || 0;
      const initialShowSeriesValues = localStorage.getItem(LS_KEYS.SHOW_SERIES_VALUES);
      const initialShowTimeFormat = localStorage.getItem(LS_KEYS.SHOW_TIME_FORMAT);
      const initialTests = document.location.toString().indexOf('test=true')>0;

      let bad         = Vue.ref(initialBad);
      let bad_length  = Vue.ref(0)
      let good        = Vue.ref(initialGood);
      let good_length = Vue.ref(0)
      let step_values = Vue.ref({bad_values: [], good_values: []});
      let short       = Vue.ref(initialShort !== '' ? parseInt(initialShort, 10) : 5);
      let long        = Vue.ref(initialLong !== '' ? parseInt(initialLong, 10) : 60);
      let threshold1  = Vue.ref(initialThreshold1 !== '' ? parseFloat(initialThreshold1) : 0.01344);
      let threshold2  = Vue.ref(initialThreshold2 !== '' ? parseFloat(initialThreshold2) : 0.01344);
      let highlightEnabled = Vue.ref(initialHighlightEnabled !== null ? JSON.parse(initialHighlightEnabled) : true);
      let debounceEnabled  = Vue.ref(initialDebounceEnabled !== null ? JSON.parse(initialDebounceEnabled) : true);
      let debounceTime     = Vue.ref(initialDebounceTime !== null ? parseInt(initialDebounceTime, 10) : 5);
      let selectedFormula  = Vue.ref(initialSelectedFormula);
      let showHelpModal    = Vue.ref(false);
      let showSeriesValues = Vue.ref(initialShowSeriesValues !== null ? JSON.parse(initialShowSeriesValues) : false);
      let showTimeFormat   = Vue.ref(initialShowTimeFormat !== null ? JSON.parse(initialShowTimeFormat) : true);
      let badSeriesData    = Vue.ref([]);
      let goodSeriesData   = Vue.ref([]);
      let expandedBad      = Vue.ref('');
      let expandedGood     = Vue.ref('');

      // --- COMPUTED CHART DATA ---
      const chartData = Vue.reactive({
        alert1: [],
        alert2: [],
        threshold1: [],
        threshold2: [],
        bad: [],
        good: [],
        rate_bad: [],
        rate_good: [],
        labels: []
      });

      // Function to update chart data
      const updateChartData = () => {
        const def_bad = fn.serieDefFromString(bad.value);
        const def_good = fn.serieDefFromString(good.value);
        const serie_bad = fn.makeSerie(def_bad);
        const serie_good = fn.makeSerie(def_good);
        bad_length.value = serie_bad.length;
        good_length.value = serie_good.length;
        const rate_bad = fn.rateOverN(serie_bad, 1);
        const rate_good = fn.rateOverN(serie_good, 1);
        step_values.value = { bad_values: serie_bad, good_values: serie_good, rate_bad, rate_good };
        // Calculate expanded definitions
        expandedBad.value = fn.expandSeriesDefinition(bad.value);
        expandedGood.value = fn.expandSeriesDefinition(good.value);
        let alert1, alert2;
        if (selectedFormula.value === 'countOverN') {
          alert1 = fn.sumOverN(serie_bad, short.value);
          alert2 = fn.sumOverN(serie_bad, long.value);
        } else {
          alert1 = fn.proportionRateOverN(serie_bad, serie_good, short.value);
          alert2 = fn.proportionRateOverN(serie_bad, serie_good, long.value);
        }
        const max = Math.max(serie_bad.length, serie_good.length);
        const th1 = fn.makeSerieConstant(parseFloat(threshold1.value), max);
        const th2 = fn.makeSerieConstant(parseFloat(threshold2.value), max);
        
        // Update the reactive object
        chartData.alert1 = alert1;
        chartData.alert2 = alert2;
        chartData.threshold1 = th1;
        chartData.threshold2 = th2;
        chartData.bad = serie_bad;
        chartData.good = serie_good;
        chartData.rate_bad = rate_bad;
        chartData.rate_good = rate_good;
        chartData.labels = new Array(max).fill(0).map((_, i) => i.toString());
      };

      // Initial update
      updateChartData();

      // Throttled update function for chart data
      let updateTimeout = null;
      let isUpdating = Vue.ref(false);
      const throttledUpdateChartData = () => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        isUpdating.value = true;
        updateTimeout = setTimeout(() => {
          updateChartData();
          isUpdating.value = false;
        }, 500);
      };

      // Watch for changes and update chart data with throttling
      Vue.watch([bad, good], throttledUpdateChartData);
      Vue.watch([short, long, threshold1, threshold2, selectedFormula], updateChartData);

      // Watchers to save to localStorage
      Vue.watch(bad, (newValue) => { localStorage.setItem(LS_KEYS.BAD, newValue); });
      Vue.watch(good, (newValue) => { localStorage.setItem(LS_KEYS.GOOD, newValue); });
      Vue.watch(short, (newValue) => { localStorage.setItem(LS_KEYS.SHORT, newValue.toString()); });
      Vue.watch(long, (newValue) => { localStorage.setItem(LS_KEYS.LONG, newValue.toString()); });
      Vue.watch(threshold1, (newValue) => { localStorage.setItem(LS_KEYS.THRESHOLD1, newValue.toString()); });
      Vue.watch(threshold2, (newValue) => { localStorage.setItem(LS_KEYS.THRESHOLD2, newValue.toString()); });
      Vue.watch(selectedFormula, (newValue) => { localStorage.setItem(LS_KEYS.SELECTED_FORMULA, newValue); });
      Vue.watch(debounceEnabled, (newValue) => { 
        localStorage.setItem(LS_KEYS.DEBOUNCE_ENABLED, newValue); 
      });
      Vue.watch(debounceTime, (newValue) => { 
        localStorage.setItem(LS_KEYS.DEBOUNCE_TIME, newValue); 
      });
      Vue.watch(showSeriesValues, (newValue) => { 
        localStorage.setItem(LS_KEYS.SHOW_SERIES_VALUES, newValue); 
      });
      Vue.watch(showTimeFormat, (newValue) => { 
        localStorage.setItem(LS_KEYS.SHOW_TIME_FORMAT, newValue); 
      });

      const toggleHelpModal = () => {
        showHelpModal.value = !showHelpModal.value;
      };

      const copyToClipboard = async (text) => {
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          console.error('Failed to copy text: ', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      };

      if (initialTests && window.runUnitTests){
        window.runUnitTests();
      }

      const result = {
        bad, 
        bad_length,
        good, 
        good_length,
        short, 
        step_values,
        long, 
        threshold1,
        threshold2,
        highlightEnabled,
        debounceEnabled,
        debounceTime,
        selectedFormula,
        showHelpModal,
        toggleHelpModal,
        showSeriesValues,
        showTimeFormat,
        expandedBad,
        expandedGood,
        copyToClipboard,
        chartData,
        isUpdating,
        fn, // Expose utility functions to template
      };
      
      return result;
    },
  });

  // Register the ChartComponent
  app.component('chartcomponent', ChartComponent);

  return app;
} 