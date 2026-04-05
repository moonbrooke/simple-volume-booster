if (!window.__volumeBooster) {
    window.__volumeBooster = {
        ctx: null,
        gainNode: null,
        compressorNode: null,
        enabled: false,
        gain: 1,
        
        // Defaults
        threshold: 0,
        ratio: 4,
        attack: 0.020,
        release: 0.20,

        init() {
            if (this.ctx) return;

            this.ctx = new AudioContext();
            
            this.gainNode = this.ctx.createGain();
            this.compressorNode = this.ctx.createDynamicsCompressor();

            this.gainNode.gain.value = 1;

            document.querySelectorAll("audio, video").forEach(media => {
                if (media.__boosted) return;

                const src = this.ctx.createMediaElementSource(media);
                
                src.connect(this.gainNode);
                media.__boosted = true;
            });

            this.gainNode.connect(this.compressorNode);
            this.compressorNode.connect(this.ctx.destination);
        },

        apply() {
            this.gainNode.gain.value = this.enabled ? this.gain : 1;
            
            if (this.enabled) {
                this.compressorNode.threshold.value = this.threshold;
                this.compressorNode.ratio.value = this.ratio;
                this.compressorNode.attack.value = this.attack;
                this.compressorNode.release.value = this.release;
            } else {
                this.compressorNode.threshold.value = 0;
                this.compressorNode.ratio.value = 1;
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
        booster.gain = msg.value;
        booster.apply();
    }
    else if (msg.type === "COMPRESSOR") {
        booster[msg.param] = parseFloat(msg.value);
        booster.apply();
    }
    else if (msg.type === "RESET_COMPRESSOR") {
        booster.threshold = 0;
        booster.ratio = 4;
        booster.attack = 0.020;
        booster.release = 0.20;
        booster.apply();
    }
    else if (msg.type === "GET_STATE") {
        sendResponse({
            enabled: booster.enabled,
            gain: booster.gain,
            threshold: booster.threshold,
            ratio: booster.ratio,
            attack: booster.attack,
            release: booster.release
        });
    }

    return true;
});
