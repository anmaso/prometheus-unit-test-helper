# SLO Unit Test Helper - Grafana Style

A web-based visualization tool for testing and designing SLO (Service Level Objective) scenarios. This tool helps you visualize how good and bad events affect SLO calculations over time, with support for different alert formulas, thresholds, and highlighting features.

## Features

- **Interactive Chart Visualization**: Real-time charts using Chart.js with pan/zoom capabilities
- **Multiple Alert Formulas**: Support for "Proportion Rate over N" and "Count over N" calculations  
- **Flexible Event Series Definition**: Define complex event patterns using a prometheus-like syntax
- **Alert Highlighting**: Visual highlighting when alert conditions are met
- **Debounce Support**: Configure alert debouncing to reduce noise
- **Series Values Display**: View raw data values for debugging
- **Persistent Configuration**: Settings are saved to localStorage
- **Grafana-Style UI**: Dark theme matching Grafana's visual design

## Quick Start

1. Open `index.html` in a web browser
2. Configure your good and bad event series
3. Set alert thresholds and window sizes
4. Click "Render" to visualize your SLO scenario

## Usage

### Event Series Definition

Define event series using segments in the format: `[initial]+[increment]x[steps]`

**Basic Examples:**
- `0+1x10` - Start at 0, increment by 1 for 10 steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
- `100+0x5` - Constant value 100 for 5 steps: [100, 100, 100, 100, 100]
- `5-2x3` - Start at 5, decrement by 2 for 3 steps: [5, 3, 1, -1]

**Advanced Examples:**
- `#+50x5` - Continue from last value, increment by 50 for 5 steps
- `0+0x60 150+150x10 #+0x60` - Complex pattern with multiple segments
- `5x3` - Shorthand for constant: [5, 5, 5]
- `_x5` - Special underscore values (5 underscores)

### Alert Formulas

#### Proportion Rate over N
Calculates: `sum(bad events in window) / (sum(bad events in window) + sum(good events in window))`
- Returns a ratio between 0 and 1
- Typical thresholds: 0.01 (1%), 0.05 (5%), etc.

#### Count over N  
Calculates: `sum(bad events in window)`
- Returns absolute count of bad events
- Only uses bad events series
- Typical thresholds: 10, 100, 1000, etc.

### Configuration Options

| Field | Description |
|-------|-------------|
| **Good Events** | Define the series of successful events over time |
| **Bad Events** | Define the series of failed events over time |
| **Alert Formula** | Choose between "Proportion Rate over N" or "Count over N" |
| **Alert 1 Window** | Window size (data points) for short-term alert calculation |
| **Alert 2 Window** | Window size (data points) for long-term alert calculation |
| **Threshold 1** | Threshold value for Alert 1 series |
| **Threshold 2** | Threshold value for Alert 2 series |

### Controls

- **Render Button**: Update chart with current configuration (or press Enter in input fields)
- **Help Button**: Show detailed help modal
- **Show Series Values**: Display raw data values below the chart
- **Highlight Alert**: Enable visual highlighting when both alerts exceed thresholds
- **Debounce Alert**: Only highlight after alert persists for specified steps

## Example Scenarios

### Basic Error Rate Spike
```
Good Events: 0+1000x60 #+850x10 #+1000x60
Bad Events: 0+0x60 150+150x10 #+0x60
Formula: Proportion Rate over N
Alert 1 Window: 5
Alert 2 Window: 60
Threshold 1: 0.01
Threshold 2: 0.01
```

### Sustained High Error Count
```
Good Events: 1000x100
Bad Events: 0+0x30 5+5x40 #+0x30
Formula: Count over N
Alert 1 Window: 10
Alert 2 Window: 30
Threshold 1: 100
Threshold 2: 50
```

## Chart Series

The visualization displays multiple series:

- **alert1** (Green): Short-term alert calculation
- **alert2** (Yellow): Long-term alert calculation  
- **threshold1** (Blue, dashed): Threshold line for Alert 1
- **threshold2** (Pink, dashed): Threshold line for Alert 2
- **bad** (Light Red, hidden by default): Raw bad events
- **good** (Light Blue, hidden by default): Raw good events
- **bad rate** (Red, hidden by default): Bad events rate
- **good rate** (Blue, hidden by default): Good events rate

## Technical Details

Writen as a single html file to reduce dependencies, just open the file and you are good to use it

### Dependencies
- Vue.js 3 (CDN)
- Chart.js 4.4.0 (CDN)
- chartjs-plugin-zoom (CDN)

### File Structure
```
metrics-visualizer-nodejs/
├── index.html          # Main application
├── tests.js            # Unit tests
└── README.md          # This file
```

### Browser Support
Works in all modern browsers. No build process required - just open `index.html`.

## Development

### Running Tests
Include `?test=true` in the URL to run unit tests on page load:
```
file:///path/to/index.html?test=true
```

### Local Storage
Configuration is automatically saved to browser localStorage with keys prefixed `slo_helper_*_v1`.

## Contributing

This is a self-contained HTML application. To contribute:

1. Make changes to `index.html`
2. Test your changes by opening in a browser
3. Run tests with `?test=true` parameter
4. Update this README if adding new features

## License

[Add your license information here]

## Support

For issues or questions, [add your contact/support information here]. 