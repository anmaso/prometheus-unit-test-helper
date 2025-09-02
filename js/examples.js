export const examples = {
    "Google SRE workbook example": {
        "formula":"proportionRateOverN",
        "good": "0+100x60 #+85x9 #+100x60",
        "bad": "0+0x60 #+15x9 #+0x60",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.0144",
        "threshold2": "0.0144",
        "debounce": "0",
        "description": "Example from the <a href='https://sre.google/workbook/alerting-on-slos/#short_and_long_windows_for_alerting'>Google SRE workbook</a>.<br><br>After a 1h period of good activity, a 15% error rate is introduced fro 10minutes. The short window triggers inmediately and the longer window follows after 5min"
    },
    "Effect of debounce": {
        "formula":"proportionRateOverN",
        "good": "0+1000x60",
        "bad": "0+10x20 250 300 300 300 350 350",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "description": "'Debounce' time corresponds to the Prometheus 'for' clause, that makes the alert wait for a certain amount of time before triggering. The <em>debounce</em> is used to prevent the alerts from being triggered too often and avoid 'flappy' alerts.<br><br>Try changing the debounce value to see the effect on the alerts:<br>• <strong>2</strong> will hide one of the alerts<br>• <strong>3</strong> will hide both"
    },
    "Unrealistic scenario": {
        "formula":"proportionRateOverN",
        "good": "0+0x60 #+850x10 #+1000x60",
        "bad": "0+0x60 #+150x10 #+0x60",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "description": "This example presents an unrealistic scenario where bad events start at the same time as good events. <br/> This has the effect of triggering the alert as soon as bad events appear, making for a steep ramp in the alert graph"
    },
    "Realistic example": {
        "formula":"proportionRateOverN",
        "good": "0+1000x60 #+850x10 #+1000x60 ",
        "bad": "0+0x60 150+150x10 #+0x60",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "description": "This example presents a more realistic scenario where bad events occur some time after good events. This has the effect of filling the alerting windows with good events, so the alert takes some time to trigger until the effect of bad events gets computed"
    },
    "Realistic vs Unrealistic side to side": {
        "formula":"proportionRateOverN",
        "good": "0+1000x60 #+850x10 #+1000x60 #+0x60 #+850x10 #+1000x60",
        "bad": "0+0x60 150+150x10 #+0x60 #+0x60 #+150x10 #+0x60",
        "alert1": "5",
        "alert2": "60",
        "threshold1": "0.01344",
        "threshold2": "0.01344",
        "debounce": "1",
        "description": "This example presents <strong>two scenarios</strong>:<br><br><strong>Scenario 1 (Realistic):</strong> For <em>60 minutes</em>, there are only good events, no alerts. At 1h, bad events start to appear that make both conditions of the alert increase slowly until the alert triggers.<br><br><strong>Scenario 2 (Unrealistic):</strong> Starts after a 1h period of no activity. Then, good and bad events appear, and the alert triggers very quickly, because the 60m window was not pre-filled with good events.<br><br>The <em>curvy shape</em> of the second condition shows how the bad events get diluted as time passes."
    }

}
