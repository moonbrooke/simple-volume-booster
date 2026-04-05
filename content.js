if (!window.__volumeBooster) {
    window.__volumeBooster = {
        ctx: null,
        gainNode: null,
        enabled: false,
        gain: 1,

        init() {
            if (this.ctx) return;

            this.ctx = new AudioContext();
            this.gainNode = this.ctx.createGain();
            this.gainNode.gain.value = 1;

            document.querySelectorAll("audio, video").forEach(media => {
                if (media.__boosted) return;

                const src = this.ctx.createMediaElementSource(media);
                src.connect(this.gainNode);
                media.__boosted = true;
            });

            this.gainNode.connect(this.ctx.destination);
        },

        apply() {
            this.gainNode.gain.value = this.enabled ? this.gain : 1;
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

    if (msg.type === "ENABLE") {
        booster.enabled = msg.value;
        booster.apply();
    }

    if (msg.type === "GAIN") {
        booster.gain = msg.value;
        booster.apply();
    }

    if (msg.type === "GET_STATE") {
        sendResponse({
            enabled: booster.enabled,
            gain: booster.gain
        });
    }

    return true;
});
