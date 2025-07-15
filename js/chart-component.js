import { fn } from './utils.js';

// ChartComponent definition
export const ChartComponent = {
  props: {
    alert1: { type: Array, required: true },
    alert2: { type: Array, required: true },
    threshold1: { type: Array, required: true },
    threshold2: { type: Array, required: true },
    bad: { type: Array, required: true },
    good: { type: Array, required: true },
    rate_bad: { type: Array, required: true },
    rate_good: { type: Array, required: true },
    labels: { type: Array, required: true },
    highlightEnabled: { type: Boolean, required: true },
    debounceEnabled: { type: Boolean, required: true },
    debounceTime: { type: [Number, String], required: true },
    showTimeFormat: { type: Boolean, default: false },
    interval: { type: String, default: '1m' }
  },
  template: `<canvas ref="chartCanvas" style="width: 100%; height: 100%;"></canvas>`,
  mounted() {
    this.$nextTick(() => {
      this.renderChart();
    });
  },
  watch: {
    alert1: 'renderChart',
    alert2: 'renderChart',
    threshold1: 'renderChart',
    threshold2: 'renderChart',
    bad: 'renderChart',
    good: 'renderChart',
    rate_bad: 'renderChart',
    rate_good: 'renderChart',
    labels: 'renderChart',
    highlightEnabled: 'renderChart',
    debounceEnabled: 'renderChart',
    debounceTime: 'renderChart',
    interval: 'renderChart',
    showTimeFormat: {
      handler(newVal, oldVal) {
        this.updateTimeFormat();
      },
      immediate: true
    },
    highlightEnabled: {
      handler(newVal, oldVal) {
        if (this._chart) {
          this._chart.options.plugins.highlight.enabled = newVal;
          this._chart.update('none');
        }
      },
      immediate: true
    },
    debounceTime: {
      handler(newVal, oldVal) {
        if (this._chart) {
          this._chart.debounceTime = newVal;
          this._chart.update('none');
        }
      },
      immediate: true
    },
    debounceEnabled: {
      handler(newVal, oldVal) {
        if (this._chart) {
          this._chart.debounceEnabled = newVal;
          this._chart.update('none');
        }
      },
      immediate: true
    },
  },
  computed: {
    showTimeFormatValue() {
      return this.showTimeFormat;
    }
  },
  methods: {
    renderChart() {
      if (!this.labels || !this.alert1 || !this.alert2) {
        return;
      }
      
      if (this._chart) {
        this._chart.destroy();
      }
      
      const canvas = this.$refs.chartCanvas;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context');
        return;
      }
      
      const config = {
        type: 'line',
        data: {
          labels: this.labels,
          datasets: [
            {label:'alert1', data:this.alert1, backgroundColor:'#73bf79', borderColor:'#73bf79'},
            {label:'alert2', data:this.alert2, backgroundColor:'#f2cc0c', borderColor:'#f2cc0c'},
            {label:'threshold1', data:this.threshold1, backgroundColor:'#6495ed', borderColor:'#6495ed', pointRadius:0, borderDash:[10, 10]},
            {label:'threshold2', data:this.threshold2, backgroundColor:'#ed6495', borderColor:'#ed6495', pointRadius:0, borderDash:[10, 10]},
            {label:'bad', data:this.bad, backgroundColor:'#ffaaaa', borderColor:'#ffaaaa', hidden:true},
            {label:'good', data:this.good, backgroundColor:'#aaaaff', borderColor:'#aaaaff', hidden:true},
            {label:'bad rate', data:this.rate_bad, backgroundColor:'#ff4500', borderColor:'#ff4500', hidden:true},
            {label:'good rate', data:this.rate_good, backgroundColor:'#007fff', borderColor:'#007fff', hidden:true},
          ]
        },
        plugins: [window.highlightPlugin],
        options: {
          datasets:{
            line:{
              borderWidth:1,
              pointRadius: 1
            }
          },
          animation: {
            duration: 0
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            highlight: { enabled: this.highlightEnabled },
            zoom: {
              zoom: { wheel: { enabled: false }, pinch: { enabled: false }, mode: 'xy' },
              pan: { enabled: true },
            },
            legend: { labels: { color: '#D8D9DA' } },
            tooltip: {
              callbacks: {
                title: (context) => {
                  const dataIndex = context[0].dataIndex;
                  const timeString = this.showTimeFormatValue ? 
                    `Time: ${fn.stepToTimeString(dataIndex, this.interval)} (${dataIndex})` :
                    `Step: ${dataIndex}`;
                  return timeString;
                }
              }
            }
          },
          interaction: { intersect: false },
          scales: {
            x: {
              display: true,
              title: { display: true },
              ticks: {
                display: true,
                maxTicksLimit: 100,
                color: '#B4B7C0',
                callback: (value) => {
                  const tickValue = this.showTimeFormatValue ? fn.stepToTimeString(value, this.interval) : value;
                  return tickValue;
                }
              },
              grid: { color: '#3A3D42' },
            },
            y: {
              display: true,
              title: { display: true, text: 'Value', color: '#D8D9DA' },
              suggestedMin: 0,
              ticks: { color: '#B4B7C0' },
              grid: { color: '#3A3D42' }
            },
            y_errors: {
              position: 'right',
              display: true,
              title: { display: true, text: 'Error Related Value', color: '#D8D9DA' },
              suggestedMin: 0,
              suggestedMax: 1,
              ticks: { color: '#B4B7C0' },
              grid: { drawOnChartArea: false, color: '#3A3D42' }
            },
          },
        },
      };
      
      try {
        this._chart = new Chart(ctx, config);
        this._chart.debounceEnabled = this.debounceEnabled;
        this._chart.debounceTime = this.debounceTime;
      } catch (error) {
        console.error('Error creating chart:', error);
      }
    },
    updateTimeFormat() {
      if (this._chart) {
        // Update the x-axis ticks callback
        this._chart.options.scales.x.ticks.callback = (value) => {
          const tickValue = this.showTimeFormatValue ? fn.stepToTimeString(value, this.interval) : value;
          return tickValue;
        };
        
        // Update the tooltip callback
        this._chart.options.plugins.tooltip.callbacks.title = (context) => {
          const dataIndex = context[0].dataIndex;
          return this.showTimeFormatValue ? 
            `Time: ${fn.stepToTimeString(dataIndex, this.interval)} (${dataIndex})` :
            `Step: ${dataIndex}`;
        };
        
        // Force chart update
        this._chart.update('none');
      }
    },
  },
  beforeUnmount() {
    if (this._chart) {
      this._chart.destroy();
    }
  }
}; 