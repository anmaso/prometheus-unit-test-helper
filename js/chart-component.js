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
    debounceTime: { type: [Number, String], required: true },
    showTimeFormat: { type: Boolean, default: false },
    logarithmicScale: { type: Boolean, default: false },
    interval: { type: String, default: '1m' }
  },
  template: `<canvas ref="chartCanvas"></canvas>`,
  mounted() {
    this.$nextTick(() => {
      this.renderChart();
      // Add resize listener to handle window resize
      window.addEventListener('resize', this.handleResize);
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
    debounceTime: 'renderChart',
    logarithmicScale: 'renderChart',
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
  },
  computed: {
    showTimeFormatValue() {
      return this.showTimeFormat;
    }
  },
  methods: {
    getLogMinValue() {
      // Collect all positive values from all data series
      const allValues = [];
      
      // Add values from all data series
      [this.alert1, this.alert2, this.threshold1, this.threshold2, this.bad, this.good, this.rate_bad, this.rate_good].forEach(series => {
        if (Array.isArray(series)) {
          series.forEach(value => {
            if (typeof value === 'number' && value > 0) {
              allValues.push(value);
            }
          });
        }
      });
      
      if (allValues.length === 0) {
        // Fallback if no positive values found
        return 0.001;
      }
      
      // Find the minimum positive value
      const minPositive = Math.min(...allValues);
      
      // Return a value that's 10x smaller than the minimum, but not smaller than 0.00001
      // This ensures good visual spacing on the log scale
      return Math.max(minPositive / 10, 0.00001);
    },
    processDataForLogScale(data) {
      // If not using logarithmic scale, return data as-is
      if (!this.logarithmicScale) {
        return data;
      }
      
      // Get the minimum value for the y-axis
      const minValue = this.getLogMinValue();
      
      // Replace zeros and negative values with the minimum value
      return data.map(value => {
        if (typeof value === 'number' && value <= 0) {
          return minValue;
        }
        return value;
      });
    },
    getTooltipLabelCallback() {
      return (context) => {
        const datasetLabel = context.dataset.label;
        const value = context.parsed.y;
        const dataIndex = context.dataIndex;
        
        // Get original value to check if it was zero
        let originalValue;
        switch(datasetLabel) {
          case 'alert1': originalValue = this.alert1[dataIndex]; break;
          case 'alert2': originalValue = this.alert2[dataIndex]; break;
          case 'threshold1': originalValue = this.threshold1[dataIndex]; break;
          case 'threshold2': originalValue = this.threshold2[dataIndex]; break;
          case 'bad': originalValue = this.bad[dataIndex]; break;
          case 'good': originalValue = this.good[dataIndex]; break;
          case 'bad rate': originalValue = this.rate_bad[dataIndex]; break;
          case 'good rate': originalValue = this.rate_good[dataIndex]; break;
          default: originalValue = value;
        }
        
        // Check if this was originally zero/negative and we're in log scale
        if (this.logarithmicScale && originalValue <= 0) {
          return `${datasetLabel}: 0 (displayed as ${value.toFixed(6)} for log scale)`;
        }
        
        return `${datasetLabel}: ${value}`;
      };
    },
    handleResize() {
      // Debounce resize events
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        if (this._chart && this.$refs.chartCanvas) {
          const canvas = this.$refs.chartCanvas;
          const containerWidth = canvas.parentElement.clientWidth - 20;
          const containerHeight = canvas.parentElement.clientHeight - 20;
          
          canvas.width = containerWidth;
          canvas.height = containerHeight;
          canvas.style.width = containerWidth + 'px';
          canvas.style.height = containerHeight + 'px';
          
          this._chart.resize(containerWidth, containerHeight);
        }
      }, 150);
    },
    renderChart() {
      if (!this.labels || !this.alert1 || !this.alert2) {
        return;
      }
      
      // Store current dataset visibility state before destroying chart
      let datasetVisibilityState = null;
      if (this._chart && this._chart.data && this._chart.data.datasets) {
        datasetVisibilityState = this._chart.data.datasets.map((dataset, index) => {
          return this._chart.isDatasetVisible(index);
        });
      }
      
      if (this._chart) {
        this._chart.destroy();
      }
      
      const canvas = this.$refs.chartCanvas;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }
      
      // Set fixed canvas dimensions to prevent width changes
      const containerWidth = canvas.parentElement.clientWidth - 20; // Account for padding
      const containerHeight = canvas.parentElement.clientHeight - 20;
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      canvas.style.width = containerWidth + 'px';
      canvas.style.height = containerHeight + 'px';
      
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
            {label:'alert1', data:this.processDataForLogScale(this.alert1), backgroundColor:'#73bf79', borderColor:'#73bf79'},
            {label:'alert2', data:this.processDataForLogScale(this.alert2), backgroundColor:'#f2cc0c', borderColor:'#f2cc0c'},
            {label:'threshold1', data:this.processDataForLogScale(this.threshold1), backgroundColor:'#6495ed', borderColor:'#6495ed', pointRadius:0, borderDash:[10, 10]},
            {label:'threshold2', data:this.processDataForLogScale(this.threshold2), backgroundColor:'#ed6495', borderColor:'#ed6495', pointRadius:0, borderDash:[10, 10]},
            {label:'bad', data:this.processDataForLogScale(this.bad), backgroundColor:'#ffaaaa', borderColor:'#ffaaaa', hidden:true},
            {label:'good', data:this.processDataForLogScale(this.good), backgroundColor:'#aaaaff', borderColor:'#aaaaff', hidden:true},
            {label:'bad rate', data:this.processDataForLogScale(this.rate_bad), backgroundColor:'#ff4500', borderColor:'#ff4500', hidden:true},
            {label:'good rate', data:this.processDataForLogScale(this.rate_good), backgroundColor:'#007fff', borderColor:'#007fff', hidden:true},
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
          responsive: false,
          maintainAspectRatio: false,
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const dataIndex = elements[0].index;
              this.scrollToSeriesValue(dataIndex);
            }
          },
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
                },
                label: this.getTooltipLabelCallback()
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
              type: this.logarithmicScale ? 'logarithmic' : 'linear',
              display: true,
              title: { display: false, text: 'Value', color: '#D8D9DA' },
              suggestedMin: this.logarithmicScale ? this.getLogMinValue() : 0,
              ticks: { color: '#B4B7C0' },
              grid: { color: '#3A3D42' }
            },
            y_errors: {
              position: 'right',
              display: true,
              title: { display: false, text: 'Error Related Value', color: '#D8D9DA' },
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
        this._chart.debounceTime = this.debounceTime;
        
        // Restore dataset visibility state if it was previously stored
        if (datasetVisibilityState && this._chart.data.datasets) {
          datasetVisibilityState.forEach((isVisible, index) => {
            if (index < this._chart.data.datasets.length) {
              // Only update if the visibility state is different from current state
              if (this._chart.isDatasetVisible(index) !== isVisible) {
                this._chart.setDatasetVisibility(index, isVisible);
              }
            }
          });
          // Update the chart to reflect visibility changes
          this._chart.update('none');
        }
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
        
        // Update the tooltip callbacks
        this._chart.options.plugins.tooltip.callbacks.title = (context) => {
          const dataIndex = context[0].dataIndex;
          return this.showTimeFormatValue ? 
            `Time: ${fn.stepToTimeString(dataIndex, this.interval)} (${dataIndex})` :
            `Step: ${dataIndex}`;
        };
        
        this._chart.options.plugins.tooltip.callbacks.label = this.getTooltipLabelCallback();
        
        // Force chart update
        this._chart.update('none');
      }
    },
    scrollToSeriesValue(dataIndex) {
      // Find the series-values-container
      const seriesContainer = document.querySelector('.series-values-container');
      if (!seriesContainer) {
        console.warn('Series values container not found');
        return;
      }
      
      // Find the series data container
      const seriesData = seriesContainer.querySelector('.series-data');
      if (!seriesData) {
        console.warn('Series data container not found');
        return;
      }
      
      // Find the specific series item for this data index (add 1 to skip header row)
      const targetRow = seriesData.children[dataIndex + 1];
      if (!targetRow) {
        console.warn(`Series row for index ${dataIndex} not found`);
        return;
      }
      
      // Scroll the container to show this row
      // Use scrollIntoView with smooth behavior and center alignment
      targetRow.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Add a brief highlight effect to the target row
      targetRow.style.transition = 'background-color 0.3s ease';
      targetRow.style.backgroundColor = 'rgba(54, 162, 235, 0.3)'; // Light blue highlight
      
      // Remove highlight after 1 second
      setTimeout(() => {
        targetRow.style.backgroundColor = '';
        setTimeout(() => {
          targetRow.style.transition = '';
        }, 300);
      }, 1000);
    },
  },
  beforeUnmount() {
    // Clean up resize listener
    window.removeEventListener('resize', this.handleResize);
    clearTimeout(this._resizeTimeout);
    
    if (this._chart) {
      this._chart.destroy();
    }
  }
}; 