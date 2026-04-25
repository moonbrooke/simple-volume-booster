const enable = document.getElementById("enable");
const slider = document.getElementById("slider");
const value = document.getElementById("value");

const thresholdSlider = document.getElementById("threshold");
const thresholdVal = document.getElementById("threshold-val");

function updateValueDisplay(gainValue) {
    const percentage = Math.round(gainValue * 100);
    value.textContent = percentage + "%";

    let color = "#a6e3a1";

    if (percentage >= 500) {
        color = "#f38ba8";
    } else if (percentage >= 400) {
        color = "#eba0ac";
    } else if (percentage >= 300) {
        color = "#fab387";
    } else if (percentage >= 200) {
        color = "#f9e2af";
    }

    value.style.color = color;
}

function updateThresholdDisplay(val) {
    thresholdVal.textContent = val + " dB";
}

async function withTab(callback) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
    }, () => callback(tab.id));
}

withTab(tabId => {
    chrome.tabs.sendMessage(tabId, { type: "GET_STATE" }, state => {
        if (!state) return;

        enable.checked = state.enabled;
        
        slider.value = state.gain;
        updateValueDisplay(state.gain);

        if (state.threshold !== undefined) {
            thresholdSlider.value = state.threshold;
            updateThresholdDisplay(state.threshold);
        }
    });
});

enable.onchange = () => {
    withTab(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "ENABLE",
            value: enable.checked
        });
    });
};

slider.oninput = () => {
    updateValueDisplay(slider.value);

    withTab(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "GAIN",
            value: slider.value
        });
    });
};

thresholdSlider.oninput = () => {
    updateThresholdDisplay(thresholdSlider.value);

    withTab(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "COMPRESSOR",
            param: "threshold",
            value: thresholdSlider.value
        });
    });
};
