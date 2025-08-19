# SLO Unit Test Helper

A Vue 3 single-page application for visualizing SLO (Service Level Objective) scenarios using Chart.js. This tool helps you define and visualize series of good and bad events over time, with configurable thresholds and alert formulas.

## Project Structure

The project has been refactored into a modular structure for better maintainability:

```
prometheus-unit-test-helper/
├── index.html              # Main HTML file with Vue template
├── css/
│   └── styles.css          # All CSS styles
├── js/
│   ├── utils.js            # Utility functions for series processing
│   ├── chart-component.js  # Vue ChartComponent definition
│   ├── chart-plugins.js    # Chart.js plugins (highlight plugin)
│   ├── tests.js            # Shared unit tests (browser + Node)
│   └── app.js              # Main Vue app logic and setup
├── node-run-tests.mjs      # Node entry to run the same tests
├── package.json            # ESM + npm scripts (start, test:node)
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## Features

- **Series Definition**: Define event series using Prometheus alert format
- **Multiple Formulas**: Support for proportion rate and count over N calculations
- **Real-time Visualization**: Interactive Chart.js charts with zoom and pan
- **Alert Highlighting**: Visual highlighting when both alerts exceed thresholds
- **Debouncing**: Configurable debounce for alert highlighting
- **Time Format Toggle**: Switch between step numbers and time format
- **Local Storage**: Persist configuration across sessions
- **Responsive Design**: Grafana-like dark theme

## Usage

1. Open `index.html` in a web browser
2. Configure your good and bad event series
3. Set thresholds and alert windows
4. Choose calculation formula (proportion rate or count)
5. Toggle highlighting and debouncing options
6. View real-time chart updates

## Series Definition Format

Each segment follows the pattern: `[initial]+[increment]x[steps]`

- `initial`: Starting value (use `#` to continue from previous value)
- `increment`: Value to add at each step
- `steps`: Number of data points in this segment

Examples:
- `0+0x60 150+150x10 #+0x60` - Starts at 0 for 60 steps, jumps to 150 and increments by 150 for 10 steps, then continues from last value with 0 increment for 60 steps
- `1x4` - Single value 1 repeated 4 times
- `#x5` - Continue from last value for 5 more steps

## Development

### Adding New Features

1. **Utility Functions**: Add to `js/utils.js`
2. **Chart Components**: Modify `js/chart-component.js`
3. **Chart Plugins**: Add to `js/chart-plugins.js`
4. **App Logic**: Update `js/app.js`
5. **Styling**: Modify `css/styles.css`

### Building

The application is a single-page app that can be served directly from a web server. No build process is required.

### Local web server

Run a simple local server to host the app during development:

```
npm run start
```

Then open `http://localhost:5173` in your browser.

Opening `index.html` directly from the filesystem also continues to work if you prefer not to run a server.

### Testing

- **Browser**: Append `?test=true` to the URL to run unit tests in the browser console.
  - Example: `http://localhost:5173/?test=true`
- **Node/CI**: Run the same tests from Node (exits 0 on pass, 1 on failure):
```
npm run test:node
```

## Dependencies

- Vue 3 (CDN)
- Chart.js 4.4.0 (CDN)
- Chart.js Zoom Plugin 2.2.0 (CDN)

## Browser Support

Modern browsers with ES6 module support. The application uses ES6 modules for better code organization.

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
prometheus-unit-test-helper/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── utils.js
│   ├── chart-component.js
│   ├── chart-plugins.js
│   ├── tests.js
│   └── app.js
├── node-run-tests.mjs
├── package.json
└── README.md
```

### Browser Support
Works in all modern browsers. No build process required - just open `index.html`.

## Development

### Running Tests
- **Browser**:
```
file:///path/to/index.html?test=true
```
- **Node/CI**:
```
npm run test:node
```

### Local Storage
Configuration is automatically saved to browser localStorage with keys prefixed `slo_helper_*_v1`.

## Contributing

This is a self-contained HTML application. To contribute:

1. Make changes to `index.html`
2. Test your changes by opening in a browser
3. Run tests with `?test=true` parameter or `npm run test:node`
4. Update this README if adding new features

## License

[Add your license information here]

## Support

For issues or questions, [add your contact/support information here]. 