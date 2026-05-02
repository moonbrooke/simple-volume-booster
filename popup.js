const enable = document.getElementById("enable");
const slider = document.getElementById("slider");
const value = document.getElementById("value");

const thresholdSlider = document.getElementById("threshold");
const thresholdVal = document.getElementById("threshold-val");

const monoToggle = document.getElementById("mono");
const panSlider = document.getElementById("pan");
const panVal = document.getElementById("pan-val");

function updateValueDisplay(gainValue) {
    const percentage = Math.round(gainValue * 100);
    value.textContent = percentage + "%";

    let color = "#a6e3a1";

    if (percentage >= 600) {
        color = "#f38ba8";
    } else if (percentage >= 500) {
        color = "#eba0ac";
    } else if (percentage >= 400) {
        color = "#fab387";
    } else if (percentage >= 300) {
        color = "#f9e2af";
    }

    value.style.color = color;
}

function updateThresholdDisplay(val) {
    thresholdVal.textContent = val + "%";
}

// Format the L/R balance percentage
function updatePanDisplay(val) {
    const pan = parseFloat(val);
    if (pan === 0) {
        panVal.textContent = "Center";
    } else if (pan < 0) {
        panVal.textContent = "L " + Math.round(Math.abs(pan) * 100) + "%";
    } else {
        panVal.textContent = "R " + Math.round(pan * 100) + "%";
    }
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
            const percentVal = Math.round(state.threshold * -2);
            thresholdSlider.value = percentVal;
            updateThresholdDisplay(percentVal);
        }

        if (state.mono !== undefined) {
            monoToggle.classList.toggle("active", state.mono);
        }

        if (state.pan !== undefined) {
            panSlider.value = state.pan;
            updatePanDisplay(state.pan);
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
            value: thresholdSlider.value * -0.5
        });
    });
};

monoToggle.onclick = () => {
    const isMonoActive = monoToggle.classList.toggle("active");
    withTab(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "MONO",
            value: isMonoActive
        });
    });
};

panSlider.oninput = () => {
    updatePanDisplay(panSlider.value);

    withTab(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "PAN",
            value: panSlider.value
        });
    });
};
