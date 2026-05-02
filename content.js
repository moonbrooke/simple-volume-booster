if (!window.__volumeBooster) {
    window.__volumeBooster = {
        ctx: null,
        gainNode: null,
        monoNode: null,
        pannerNode: null,
        compressorNode: null,
        enabled: false,
        gain: 1,

        // Balance Defaults
        mono: false,
        pan: 0,

        // Compressor settings
        threshold: 0, // 0db
        ratio: 20, // 20:1
        attack: 0.020, // 20ms
        release: 0.20, // 200ms

        init() {
            if (this.ctx) return;

            this.ctx = new AudioContext();

            this.gainNode = this.ctx.createGain();
            this.monoNode = this.ctx.createGain();
            this.pannerNode = this.ctx.createStereoPanner();
            this.compressorNode = this.ctx.createDynamicsCompressor();

            this.gainNode.gain.value = 1;

            document.querySelectorAll("audio, video").forEach(media => {
                if (media.__boosted) return;

                try {
                    const src = this.ctx.createMediaElementSource(media);
                    src.connect(this.gainNode);
                    media.__boosted = true;
                } catch (e) {
                    console.error("Simple Volume Booster: Failed to connect media", e);
                }
            });

            this.gainNode.connect(this.monoNode);
            this.monoNode.connect(this.pannerNode);
            this.pannerNode.connect(this.compressorNode);
            this.compressorNode.connect(this.ctx.destination);
        },

        apply() {
            this.gainNode.gain.value = this.enabled ? this.gain : 1;

            if (this.enabled) {
                this.compressorNode.threshold.value = this.threshold;
                this.compressorNode.ratio.value = this.ratio;
                this.compressorNode.attack.value = this.attack;
                this.compressorNode.release.value = this.release;

                if (this.mono) {
                    this.monoNode.channelCount = 1;
                    this.monoNode.channelCountMode = 'explicit';
                } else {
                    this.monoNode.channelCount = 2;
                    this.monoNode.channelCountMode = 'max';
                }

                this.pannerNode.pan.value = this.pan;

            } else {
                this.compressorNode.threshold.value = 0;
                this.compressorNode.ratio.value = 1;

                this.monoNode.channelCount = 2;
                this.monoNode.channelCountMode = 'max';

                this.pannerNode.pan.value = 0;
            }
        }
    };
}

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    const booster = window.__volumeBooster;
    booster.init();

    if (msg.type === "TOGGLE") {
        booster.enabled = !booster.enabled;
        booster.apply();
    }
    else if (msg.type === "ENABLE") {
        booster.enabled = msg.value;
        booster.apply();
    }
    else if (msg.type === "GAIN") {
        booster.gain = parseFloat(msg.value);
        booster.apply();
    }
    else if (msg.type === "COMPRESSOR") {
        booster[msg.param] = parseFloat(msg.value);
        booster.apply();
    }
    else if (msg.type === "MONO") {
        booster.mono = msg.value;
        booster.apply();
    }
    else if (msg.type === "PAN") {
        booster.pan = parseFloat(msg.value);
        booster.apply();
    }
    else if (msg.type === "RESET_COMPRESSOR") {
        booster.threshold = 0;
        booster.ratio = 20;
        booster.attack = 0.020;
        booster.release = 0.20;

        booster.mono = false;
        booster.pan = 0;
        booster.apply();
    }
    else if (msg.type === "GET_STATE") {
        sendResponse({
            enabled: booster.enabled,
            gain: booster.gain,
            threshold: booster.threshold,
            ratio: booster.ratio,
            attack: booster.attack,
            release: booster.release,
            mono: booster.mono,
            pan: booster.pan
        });
    }

    return true;
});
