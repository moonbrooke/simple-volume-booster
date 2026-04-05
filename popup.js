const enable = document.getElementById("enable");
const slider = document.getElementById("slider");
const value = document.getElementById("value");

const compParams = ['threshold', 'ratio', 'attack', 'release'];
const compElements = {};
const compDisplays = {};

compParams.forEach(p => {
    compElements[p] = document.getElementById(p);
    compDisplays[p] = document.getElementById(`${p}-val`);
});

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

function updateCompDisplay(param, val) {
    let displayVal = parseFloat(val);
    if (param === 'attack' || param === 'release') {
        displayVal = Math.round(displayVal * 1000);
    }
    compDisplays[param].textContent = displayVal;
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

        compParams.forEach(p => {
            if (state[p] !== undefined) {
                compElements[p].value = state[p];
                updateCompDisplay(p, state[p]);
            }
        });
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

compParams.forEach(p => {
    compElements[p].oninput = () => {
        updateCompDisplay(p, compElements[p].value);

        withTab(tabId => {
            chrome.tabs.sendMessage(tabId, {
                type: "COMPRESSOR",
                param: p,
                value: compElements[p].value
            });
        });
    };
});

const resetCompBtn = document.getElementById("reset-comp");

const defaultCompSettings = {
    threshold: 0,
    ratio: 4,
    attack: 0.020,
    release: 0.20
};

resetCompBtn.onclick = () => {
    compParams.forEach(p => {
        const defaultVal = defaultCompSettings[p];
        compElements[p].value = defaultVal;
        updateCompDisplay(p, defaultVal);
    });

    withTab(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "RESET_COMPRESSOR"
        });
    });
};
