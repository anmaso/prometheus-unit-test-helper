export const examples = {
    "short triggers": {
        "good": "0+1000x60",
        "bad": "0+10x20 250 300 300 300 350 350",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "tittle": "Effect of debounce",
        "description": "This is a short example of a good and bad series with two alerts and two thresholds. The alerts are triggered when the series crosses the thresholds. The debounce is used to prevent the alerts from being triggered too often. Try changing the debounce value to see the effect on the alerts. 2 will hide one of the alerts, 3 will hide both."
    }
}