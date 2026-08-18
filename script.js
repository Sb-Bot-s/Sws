/* =========================================================
   1. MANEJO DE COOKIES
========================================================= */

function setCookie(name, value, days) {
    let expires = "";

    if (days) {
        let date = new Date();

        date.setTime(
            date.getTime() +
            (days * 24 * 60 * 60 * 1000)
        );

        expires = "; expires=" + date.toUTCString();
    }

    document.cookie =
        name +
        "=" +
        (value || "") +
        expires +
        "; path=/; SameSite=Lax";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {

        let c = ca[i];

        while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
        }

        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }

    return null;
}

const HAS_SEEN_VIDEO =
    getCookie("video_visto") === "true";


/* =========================================================
   2. WEB AUDIO API
========================================================= */

let audioCtx = null;

function initAudioContext() {

    if (!audioCtx) {
        audioCtx =
            new (window.AudioContext ||
                 window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

let isTic = true;
let cachedNoiseBuffer = null;

function createNoiseBuffer() {

    if (!audioCtx) return null;

    const bufferSize =
        audioCtx.sampleRate * 0.03;

    const buffer =
        audioCtx.createBuffer(
            1,
            bufferSize,
            audioCtx.sampleRate
        );

    const output =
        buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    return buffer;
}

function tick(intensity = 1) {

    if (
        !audioCtx ||
        audioCtx.state === "suspended"
    ) {
        return;
    }

    const now = audioCtx.currentTime;

    if (!cachedNoiseBuffer) {
        cachedNoiseBuffer = createNoiseBuffer();
    }

    const isTicSound = isTic;

    isTic = !isTic;

    const osc =
        audioCtx.createOscillator();

    const oscGain =
        audioCtx.createGain();

    osc.type = "sine";

    osc.frequency.setValueAtTime(
        isTicSound ? 220 : 170,
        now
    );

    osc.frequency.exponentialRampToValueAtTime(
        30,
        now + 0.025
    );

    oscGain.gain.setValueAtTime(
        0.2 * intensity,
        now
    );

    oscGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.025
    );

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.03);

    if (cachedNoiseBuffer) {

        const noiseSource =
            audioCtx.createBufferSource();

        noiseSource.buffer =
            cachedNoiseBuffer;

        const filter =
            audioCtx.createBiquadFilter();

        filter.type = "bandpass";

        filter.frequency.setValueAtTime(
            isTicSound ? 1400 : 1000,
            now
        );

        filter.Q.setValueAtTime(
            3.5,
            now
        );

        const noiseGain =
            audioCtx.createGain();

        noiseGain.gain.setValueAtTime(
            0.1 * intensity,
            now
        );

        noiseGain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.02
        );

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        noiseSource.start(now);
        noiseSource.stop(now + 0.025);
    }
}

function finalTick() {

    if (
        !audioCtx ||
        audioCtx.state === "suspended"
    ) {
        return;
    }

    const now = audioCtx.currentTime;

    const osc =
        audioCtx.createOscillator();

    const gain =
        audioCtx.createGain();

    osc.type = "triangle";

    osc.frequency.setValueAtTime(
        110,
        now
    );

    osc.frequency.exponentialRampToValueAtTime(
        25,
        now + 0.6
    );

    gain.gain.setValueAtTime(
        0.6,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.65
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
}


/* =========================================================
   3. CONFIGURACIÓN DEL RELOJ
========================================================= */

const DEBUG = false;
const DEBUG_REMAINING = 20;

const START_TIME = 24 * 60 * 60;
const INTRO_DURATION = 2.5;


/* =========================================================
   4. REFERENCIAS DOM
========================================================= */

const clockScene =
    document.getElementById("clockScene");

const videoPromptContainer =
    document.getElementById(
        "videoPromptContainer"
    );

const startVideoBtn =
    document.getElementById(
        "startVideoBtn"
    );

const videoWrapper =
    document.getElementById(
        "videoWrapper"
    );

const video =
    document.getElementById("video");

const status =
    document.getElementById("status");

const sequenceTextEl =
    document.getElementById(
        "sequenceText"
    );

const gifCanvas =
    document.getElementById("gifCanvas");

const digits = [
    ...document.querySelectorAll(".flip-digit")
];

const separators = [
    ...document.querySelectorAll(".separator")
];


/* =========================================================
   5. ESTADO
========================================================= */

let state = "READY";
let running = false;
let targetDate = null;

let virtualTime = START_TIME;

let lastFrame = 0;
let raf = null;
let lastSecond = -1;

let debugStart = 0;
let animStartTime = 0;

let minimizeTimeout = null;


/* =========================================================
   6. TEXTOS
========================================================= */

const TEXT_MESSAGES_1 = [

    {
        text: "Ola sorra",
        duration: 2800
    },

    {
        text: "Mira esto lo tenía como frist gif",
        duration: 3200
    },

    {
        text: "pero creo que ahora es un previo",
        duration: 3200
    },

    {
        text: "anyways",
        duration: 2200
    },

    {
        text: "mira...",
        duration: 2500
    }

];

const TEXT_MESSAGES_2 = [

    {
        text: "ojala k te hayga gustado.",
        duration: 3000
    },

    {
        text: "ahi nomas pa q sea otra cosilla",
        duration: 3200
    },

    {
        text: "listo eso es todo.",
        duration: 2500
    },

    {
        text: "maybe este dormido cuando lo veas xdddd (si es que lo vez)",
        duration: 4000
    }

];


/* =========================================================
   7. FECHA OBJETIVO
========================================================= */

function getTargetDate() {

    const now = new Date();

    let year = now.getFullYear();

    let target =
        new Date(
            year,
            7,
            19,
            0,
            0,
            0,
            0
        );

    if (
        target.getTime() <=
        now.getTime()
    ) {

        target =
            new Date(
                year + 1,
                7,
                19,
                0,
                0,
                0,
                0
            );
    }

    return target;
}


/* =========================================================
   8. TIEMPO RESTANTE
========================================================= */

function getRemaining() {

    if (DEBUG) {

        return Math.max(
            0,
            DEBUG_REMAINING -
            (performance.now() - debugStart) / 1000
        );
    }

    return Math.max(
        0,
        (targetDate.getTime() -
         Date.now()) / 1000
    );
}


/* =========================================================
   9. FORMATEO
========================================================= */

function formatTime(seconds) {

    seconds =
        Math.max(
            0,
            Math.floor(seconds)
        );

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const secs =
        seconds % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}

function getDigits(seconds) {

    const text =
        formatTime(seconds);

    return [
        text[0],
        text[1],
        text[3],
        text[4],
        text[6],
        text[7]
    ];
}


/* =========================================================
   10. ANIMACIÓN DE DÍGITOS
========================================================= */

function flipDigit(
    element,
    oldValue,
    newValue,
    duration
) {

    if (oldValue === newValue) {
        return;
    }

    const topPanel =
        element.querySelector(
            ".flip-panel.top"
        );

    const bottomPanel =
        element.querySelector(
            ".flip-panel.bottom"
        );

    const topStatic =
        element.querySelector(
            ".top-static span"
        );

    const bottomStatic =
        element.querySelector(
            ".bottom-static span"
        );

    topStatic.textContent = oldValue;
    bottomStatic.textContent = oldValue;

    topPanel.querySelector("span")
        .textContent = oldValue;

    bottomPanel.querySelector("span")
        .textContent = newValue;

    element.classList.remove("flip");

    topPanel.style.animation = "none";
    bottomPanel.style.animation = "none";

    void element.offsetWidth;

    topPanel.style.animation = "";
    bottomPanel.style.animation = "";

    element.style.setProperty(
        "--duration",
        `${duration}ms`
    );

    element.classList.add("flip");

    setTimeout(() => {

        element.classList.remove("flip");

        topStatic.textContent = newValue;
        bottomStatic.textContent = newValue;

        topPanel.querySelector("span")
            .textContent = newValue;

        bottomPanel.querySelector("span")
            .textContent = newValue;

    }, duration + 80);
}


/* =========================================================
   11. RENDER DEL RELOJ
========================================================= */

function render(seconds, speed) {

    const values =
        getDigits(seconds);

    const duration =
        Math.max(
            70,
            Math.min(
                260,
                180 / Math.max(.2, speed)
            )
        );

    let changed = false;

    digits.forEach(
        (element, index) => {

            const oldValue =
                element.dataset.value;

            const newValue =
                values[index];

            if (
                oldValue === newValue
            ) {
                return;
            }

            changed = true;

            flipDigit(
                element,
                oldValue,
                newValue,
                duration
            );

            element.dataset.value =
                newValue;
        }
    );

    if (changed) {

        tick(
            Math.min(
                1,
                .3 + speed * .06
            )
        );

        separators.forEach(
            separator => {

                separator.classList.remove(
                    "flash"
                );

                void separator.offsetWidth;

                separator.classList.add(
                    "flash"
                );
            }
        );
    }
}


/* =========================================================
   12. INICIO DEL RELOJ
========================================================= */

function autoStartClock() {

    if (running) {
        return;
    }

    targetDate =
        getTargetDate();

    if (DEBUG) {
        debugStart =
            performance.now();
    }

    const remaining =
        getRemaining();

    if (remaining <= 0) {
        finish();
        return;
    }

    /*
     * SI YA SE VIO EL VIDEO
     */

    if (HAS_SEEN_VIDEO) {

        state = "REAL";
        running = true;

        virtualTime =
            remaining;

        lastFrame =
            performance.now();

        lastSecond =
            Math.floor(remaining);

        status.textContent =
            "TIEMPO REAL • 1×";

        clockScene.classList.add(
            "final-center"
        );

        randomizeGifs();

        gifCanvas.classList.add(
            "visible"
        );

        raf =
            requestAnimationFrame(loop);

        return;
    }

    /*
     * PRIMERA VEZ
     */

    state = "ANIMATING";

    animStartTime =
        performance.now();

    virtualTime =
        START_TIME;

    running = true;

    lastFrame =
        performance.now();

    lastSecond =
        Math.floor(virtualTime);

    status.textContent =
        "SINCRONIZANDO...";

    raf =
        requestAnimationFrame(loop);
}


/* =========================================================
   13. LOOP PRINCIPAL
========================================================= */

function loop(timestamp) {

    if (!running) {
        return;
    }

    lastFrame =
        timestamp;

    const remaining =
        getRemaining();

    if (remaining <= 0) {
        finish();
        return;
    }

    /*
     * ANIMACIÓN INICIAL
     */

    if (state === "ANIMATING") {

        const elapsed =
            (timestamp - animStartTime) / 1000;

        const progress =
            Math.min(
                1,
                elapsed / INTRO_DURATION
            );

        const easeOut =
            1 -
            Math.pow(
                1 - progress,
                3
            );

        const distance =
            START_TIME -
            remaining;

        virtualTime =
            START_TIME -
            (distance * easeOut);

        const speed =
            Math.max(
                1,
                (distance /
                    INTRO_DURATION /
                    1000) *
                (1 - progress)
            );

        render(
            virtualTime,
            speed
        );

        if (progress >= 1) {

            state = "REAL";

            status.textContent =
                "TIEMPO REAL • 1×";

            virtualTime =
                remaining;

            lastSecond =
                Math.floor(remaining);

            if (!minimizeTimeout) {

                minimizeTimeout =
                    setTimeout(() => {

                        clockScene.classList.add(
                            "minimized"
                        );

                        setTimeout(() => {

                            playTextSequence(
                                TEXT_MESSAGES_1,
                                () => {
                                    showVideoPrompt();
                                }
                            );

                        }, 1200);

                    }, 3000);
            }
        }
    }


    /*
     * TIEMPO REAL
     */

    if (state === "REAL") {

        virtualTime =
            remaining;

        const currentSecond =
            Math.floor(remaining);

        if (
            currentSecond !==
            lastSecond
        ) {

            lastSecond =
                currentSecond;

            render(
                virtualTime,
                1
            );
        }
    }

    raf =
        requestAnimationFrame(loop);
}


/* =========================================================
   14. SECUENCIAS DE TEXTO
========================================================= */

function playTextSequence(
    messages,
    onComplete
) {

    let index = 0;

    function nextMessage() {

        if (index >= messages.length) {

            sequenceTextEl.style.display =
                "none";

            if (onComplete) {
                onComplete();
            }

            return;
        }

        const currentMsg =
            messages[index];

        sequenceTextEl.textContent =
            currentMsg.text;

        sequenceTextEl.classList.add(
            "visible"
        );

        setTimeout(() => {

            sequenceTextEl.classList.remove(
                "visible"
            );

            setTimeout(() => {

                index++;

                nextMessage();

            }, 800);

        }, currentMsg.duration);
    }

    nextMessage();
}


/* =========================================================
   15. VIDEO
========================================================= */

function showVideoPrompt() {

    videoPromptContainer.classList.add(
        "visible"
    );
}

startVideoBtn.addEventListener(
    "click",
    () => {

        videoPromptContainer.classList.remove(
            "visible"
        );

        setTimeout(() => {

            videoPromptContainer.style.display =
                "none";

            showCentralVideo();

        }, 600);
    }
);


function showCentralVideo() {

    videoWrapper.classList.add(
        "show"
    );

    video.addEventListener(
        "ended",
        onVideoEnded
    );

    video.play().catch(err => {

        console.log(
            "Error al reproducir el video local:",
            err
        );
    });
}


function onVideoEnded() {

    setCookie(
        "video_visto",
        "true",
        365
    );

    videoWrapper.classList.remove(
        "show"
    );

    videoWrapper.classList.add(
        "hide"
    );

    setTimeout(() => {

        sequenceTextEl.style.display =
            "block";

        playTextSequence(
            TEXT_MESSAGES_2,
            () => {

                clockScene.classList.remove(
                    "minimized"
                );

                clockScene.classList.add(
                    "final-center"
                );

                randomizeGifs();

                gifCanvas.classList.add(
                    "visible"
                );
            }
        );

    }, 800);
}


/* =========================================================
   16. GIFS ALEATORIOS
========================================================= */

function randomizeGifs() {

    const gifItems =
        document.querySelectorAll(
            ".gif-item"
        );

    if (gifItems.length === 0) {
        return;
    }

    const zones = [

        {
            top: [5, 20],
            left: [5, 25]
        },

        {
            top: [5, 20],
            left: [70, 88]
        },

        {
            top: [70, 85],
            left: [5, 25]
        },

        {
            top: [70, 85],
            left: [70, 88]
        },

        {
            top: [40, 55],
            left: [4, 18]
        },

        {
            top: [40, 55],
            left: [78, 90]
        }

    ];

    gifItems.forEach(
        (gif, index) => {

            const zone =
                zones[
                    index %
                    zones.length
                ];

            const randomTop =
                Math.floor(
                    Math.random() *
                    (
                        zone.top[1] -
                        zone.top[0] +
                        1
                    )
                ) +
                zone.top[0];

            const randomLeft =
                Math.floor(
                    Math.random() *
                    (
                        zone.left[1] -
                        zone.left[0] +
                        1
                    )
                ) +
                zone.left[0];

            const randomDelay =
                (
                    Math.random() * 2
                ).toFixed(1);

            gif.style.top =
                `${randomTop}%`;

            gif.style.left =
                `${randomLeft}%`;

            gif.style.animationDelay =
                `${randomDelay}s`;
        }
    );
}


/* =========================================================
   17. FINALIZAR
========================================================= */

function finish() {

    if (state === "FINISHED") {
        return;
    }

    running = false;
    state = "FINISHED";

    cancelAnimationFrame(raf);

    if (minimizeTimeout) {
        clearTimeout(minimizeTimeout);
    }

    virtualTime = 0;

    render(
        0,
        1
    );

    status.textContent =
        "00:00:00";

    finalTick();

    clockScene.classList.add(
        "final-pulse"
    );
}


/* =========================================================
   18. INICIO / INTERACCIÓN
========================================================= */

const startOverlay =
    document.getElementById(
        "startOverlay"
    );

function launchExperience() {

    initAudioContext();

    startOverlay.classList.add(
        "hidden"
    );

    autoStartClock();
}

startOverlay.addEventListener(
    "click",
    launchExperience
);

startOverlay.addEventListener(
    "touchstart",
    launchExperience
);
