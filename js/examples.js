export const examples = {
    "Effect of debounce": {
        "formula":"proportionRateOverN",
        "good": "0+1000x60",
        "bad": "0+10x20 250 300 300 300 350 350",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "description": "This is a short example of a good and bad series with two alerts and two thresholds. The alerts are triggered when the series crosses the thresholds. The debounce is used to prevent the alerts from being triggered too often. Try changing the debounce value to see the effect on the alerts. 2 will hide one of the alerts, 3 will hide both."
    },
    "Pre-fill alert windows with good events": {
        "formula":"proportionRateOverN",
        "good": "0+1000x60 #+850x10 #+1000x60 #+0x60 #+850x10 #+1000x60",
        "bad": "0+0x60 150+150x10 #+0x60 #+0x60 #+150x10 #+0x60",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "description": "This example presents two scenarios. The first scenario is more realistic. For 60m, there are only good events, no alerts. At 1h, bad events start to appear that make both conditions of the alert increase slowly until the alert triggers. The second example is unrealistic, it starts after a 1h period of no activity. Then, good and bad events appear, and the alert triggers very quickly, because the 60m window was not pre-filled with good events. The curvy shape of the second condition shows how the bad events get deluted as time passes"
    }

}