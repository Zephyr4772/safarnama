const tracks = [
  {
    title: "Chura Ke Dil Mera",
    artist: "Kumar Sanu, Alka Yagnik",
    duration: 90,
    src: "audio/chura-ke-dil-mera.mp3",
    cover: "Chura-Ke-Dil-Mera-Sped-Up-Hindi-2024-20240206113711-500x500.jpg"
  },
  {
    title: "Mujhse Mohabbat Ka Izhaar Karta",
    artist: "Kumar Sanu, Sadhana Sargam",
    duration: 90,
    src: "audio/mujhse-mohabbat.mp3",
    cover: "covers/N0jnLZxYwYc.jpg"
  }
];

const els = {
  cover: document.getElementById("cover"),
  vinyl: document.getElementById("vinyl"),
  title: document.getElementById("title"),
  artist: document.getElementById("artist"),
  seek: document.getElementById("seek"),
  fill: document.getElementById("seek-fill"),
  thumb: document.getElementById("seek-thumb"),
  timeCur: document.getElementById("time-cur"),
  timeDur: document.getElementById("time-dur"),
  play: document.getElementById("btn-play"),
  iconPlay: document.getElementById("icon-play"),
  iconPause: document.getElementById("icon-pause"),
  prev: document.getElementById("btn-prev"),
  next: document.getElementById("btn-next"),
  eqBars: document.getElementById("eq-bars"),
  online: document.getElementById("online-count"),
  clock: document.getElementById("clock"),
  audio: document.getElementById("audio-player")
};

if (els.audio) {
  els.audio.volume = 0.5;
}

const state = { index: 0, pos: 0, playing: false, lastTs: null, dragging: false };

function fmt(s) {
  s = Math.max(0, Math.floor(s || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function render() {
  const t = tracks[state.index];
  const dur = t.duration || 1;
  const pct = Math.min(100, Math.max(0, (state.pos / dur) * 100));
  els.fill.style.width = pct + "%";
  els.thumb.style.left = pct + "%";
  els.timeCur.textContent = fmt(state.pos);
  els.timeDur.textContent = fmt(dur);
  els.seek.setAttribute("aria-valuenow", Math.round(pct));
}

function load(i, autoPlay = false) {
  const newIndex = (i + tracks.length) % tracks.length;
  state.index = newIndex;
  state.pos = 0;
  const t = tracks[state.index];
  els.cover.src = t.cover;
  els.title.textContent = t.title;
  els.artist.textContent = t.artist;
  render();

  if (els.audio && t.src) {
    els.audio.src = t.src;
    els.audio.load();
    if (autoPlay || state.playing) {
      els.audio.play().then(() => {
        setPlayingUI(true);
      }).catch(() => {
        setPlayingUI(false);
      });
    }
  }
}

if (els.audio) {
  els.audio.addEventListener("timeupdate", () => {
    if (!state.dragging && !isNaN(els.audio.currentTime)) {
      state.pos = els.audio.currentTime;
      render();
    }
  });

  els.audio.addEventListener("loadedmetadata", () => {
    if (els.audio.duration && !isNaN(els.audio.duration)) {
      tracks[state.index].duration = els.audio.duration;
      render();
    }
  });

  els.audio.addEventListener("ended", () => {
    load(state.index + 1, true);
  });

  els.audio.addEventListener("play", () => setPlayingUI(true));
  els.audio.addEventListener("pause", () => {
    if (!state.dragging) setPlayingUI(false);
  });
}

function tick() {
  if (els.audio && !els.audio.paused && !state.dragging) {
    state.pos = els.audio.currentTime;
    render();
  }
  requestAnimationFrame(tick);
}

function setPlayingUI(on) {
  state.playing = on;
  els.iconPlay.style.display = on ? "none" : "";
  els.iconPause.style.display = on ? "" : "none";
  els.vinyl.classList.toggle("playing", on);
  if (els.eqBars) els.eqBars.classList.toggle("playing", on);
  els.play.setAttribute("aria-label", on ? "Pause" : "Play");
  els.play.setAttribute("aria-pressed", String(on));
  document.title = on
    ? "\u25B6 " + tracks[state.index].title + " \u2014 \u0938\u092B\u093C\u0930\u0928\u093E\u092E\u093E"
    : "\u0938\u092B\u093C\u0930\u0928\u093E\u092E\u093E";
}

function togglePlay() {
  if (!state.playing) {
    if (els.audio && els.audio.src) {
      els.audio.play().catch(() => {});
    }
    setPlayingUI(true);
  } else {
    if (els.audio) {
      els.audio.pause();
    }
    setPlayingUI(false);
  }
}

els.play.addEventListener("click", togglePlay);
els.prev.addEventListener("click", () => {
  if (state.pos > 3) {
    if (els.audio) els.audio.currentTime = 0;
    state.pos = 0;
    render();
  } else {
    load(state.index - 1, state.playing);
  }
});
els.next.addEventListener("click", () => load(state.index + 1, state.playing));

function seekFromEvent(e) {
  const rect = els.seek.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const pct = Math.min(1, Math.max(0, x / rect.width));
  const t = tracks[state.index];
  state.pos = pct * (t.duration || 1);
  render();
}

els.seek.addEventListener("pointerdown", (e) => {
  state.dragging = true;
  els.seek.classList.add("dragging");
  els.seek.setPointerCapture(e.pointerId);
  seekFromEvent(e);
});

els.seek.addEventListener("pointermove", (e) => {
  if (state.dragging) seekFromEvent(e);
});

els.seek.addEventListener("pointerup", () => {
  if (state.dragging) {
    state.dragging = false;
    els.seek.classList.remove("dragging");
    if (els.audio && els.audio.duration) {
      els.audio.currentTime = state.pos;
    }
  }
});

els.seek.addEventListener("keydown", (e) => {
  const d = tracks[state.index].duration || 1;
  let newPos = state.pos;
  if (e.key === "ArrowRight") newPos = Math.min(d, state.pos + 5);
  else if (e.key === "ArrowLeft") newPos = Math.max(0, state.pos - 5);
  else return;
  e.preventDefault();
  state.pos = newPos;
  if (els.audio && els.audio.duration) {
    els.audio.currentTime = state.pos;
  }
  render();
});

// Real-Time Live Presence Counter via WebSockets (Global & Local Multi-Instance Sync)
(function initRealtimePresence() {
  if (!els.online) return;

  const tabId = "usr_" + Math.random().toString(36).slice(2, 8) + "_" + Date.now().toString(36);
  const STORAGE_KEY = "safrnaamaa_active_instances_v1";
  const CHANNEL_NAME = "safrnaamaa_presence_channel";
  const WS_TOPIC = "safrnaamaa/presence/live_v1";
  const WS_ENDPOINTS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  const remotePeers = new Map();
  remotePeers.set(tabId, Date.now());

  let localChannel = null;
  let wsClient = null;
  let wsEndpointIndex = 0;

  function getStoredInstances() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const now = Date.now();
      const valid = {};
      for (const [id, time] of Object.entries(data)) {
        if (now - time < 4000) valid[id] = time;
      }
      return valid;
    } catch (e) {
      return {};
    }
  }

  function saveStoredInstances(instances) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
    } catch (e) {}
  }

  function updateDisplay() {
    const now = Date.now();
    for (const [id, lastSeen] of remotePeers.entries()) {
      if (id !== tabId && now - lastSeen > 12000) {
        remotePeers.delete(id);
      }
    }
    const localCount = Object.keys(getStoredInstances()).length;
    const globalCount = remotePeers.size;
    const finalCount = Math.max(1, localCount, globalCount);
    if (els.online && els.online.textContent !== String(finalCount)) {
      els.online.textContent = String(finalCount);
    }
  }

  function recalculateLocal() {
    const stored = getStoredInstances();
    stored[tabId] = Date.now();
    saveStoredInstances(stored);
    updateDisplay();
    return stored;
  }

  // Native Lightweight WebSocket MQTT Client (Zero Dependencies)
  function connectWebSocket() {
    const endpoint = WS_ENDPOINTS[wsEndpointIndex % WS_ENDPOINTS.length];
    let ws = null;
    let pingTimer = null;

    try {
      ws = new WebSocket(endpoint, "mqtt");
      ws.binaryType = "arraybuffer";
    } catch (err) {
      wsEndpointIndex++;
      setTimeout(connectWebSocket, 3000);
      return;
    }

    function encodeUtf8(str) { return new TextEncoder().encode(str); }
    function decodeUtf8(buf) { return new TextDecoder().decode(buf); }
    function buildLength(len) {
      const bytes = [];
      do {
        let digit = len % 128;
        len = Math.floor(len / 128);
        if (len > 0) digit = digit | 0x80;
        bytes.push(digit);
      } while (len > 0);
      return bytes;
    }

    ws.onopen = () => {
      const proto = encodeUtf8("MQTT");
      const cid = encodeUtf8(tabId);
      const varHeader = [0x00, proto.length, ...proto, 0x04, 0x02, 0x00, 30];
      const payload = [0x00, cid.length, ...cid];
      const remaining = [...varHeader, ...payload];
      const packet = new Uint8Array([0x10, ...buildLength(remaining.length), ...remaining]);
      ws.send(packet.buffer);
    };

    ws.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      const packetType = data[0] >> 4;

      if (packetType === 2 && data[3] === 0) {
        // CONNACK: Subscribe to topic
        const tBuf = encodeUtf8(WS_TOPIC);
        const subPayload = [0x00, 0x01, 0x00, tBuf.length, ...tBuf, 0x00];
        const subPacket = new Uint8Array([0x82, ...buildLength(subPayload.length), ...subPayload]);
        ws.send(subPacket.buffer);

        // Announce our presence to all connected instances
        publish({ event: "join", id: tabId });

        // Keep-alive MQTT ping
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(new Uint8Array([0xC0, 0x00]).buffer);
          }
        }, 20000);
      } else if (packetType === 3) {
        // PUBLISH message received
        try {
          let offset = 1;
          let multiplier = 1;
          let remLen = 0;
          while (offset < data.length) {
            const digit = data[offset++];
            remLen += (digit & 0x7F) * multiplier;
            multiplier *= 128;
            if ((digit & 0x80) === 0) break;
          }
          const topicLen = (data[offset] << 8) | data[offset + 1];
          offset += 2 + topicLen;
          const payloadStr = decodeUtf8(data.slice(offset));
          const msg = JSON.parse(payloadStr);

          if (msg && msg.id && msg.id !== tabId) {
            if (msg.event === "join") {
              remotePeers.set(msg.id, Date.now());
              // Reply so the newly joined client discovers us immediately
              publish({ event: "pong", id: tabId });
            } else if (msg.event === "pong" || msg.event === "ping") {
              remotePeers.set(msg.id, Date.now());
            } else if (msg.event === "leave") {
              remotePeers.delete(msg.id);
            }
            updateDisplay();
          }
        } catch (e) {}
      }
    };

    function publish(obj) {
      if (ws.readyState !== WebSocket.OPEN) return;
      try {
        const tBuf = encodeUtf8(WS_TOPIC);
        const pBuf = encodeUtf8(JSON.stringify(obj));
        const rem = [0x00, tBuf.length, ...tBuf, ...pBuf];
        const pubPacket = new Uint8Array([0x30, ...buildLength(rem.length), ...rem]);
        ws.send(pubPacket.buffer);
      } catch (e) {}
    }

    ws.onclose = () => {
      clearInterval(pingTimer);
      wsEndpointIndex++;
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      try { ws.close(); } catch (e) {}
    };

    wsClient = {
      publish,
      close: () => {
        try {
          publish({ event: "leave", id: tabId });
          ws.close();
        } catch (e) {}
      }
    };
  }

  // Cross-Tab Local BroadcastChannel
  if (typeof BroadcastChannel !== "undefined") {
    try {
      localChannel = new BroadcastChannel(CHANNEL_NAME);
      localChannel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;
        if (data.type === "join" || data.type === "heartbeat") {
          const stored = getStoredInstances();
          stored[tabId] = Date.now();
          saveStoredInstances(stored);
          updateDisplay();
        } else if (data.type === "leave") {
          const stored = getStoredInstances();
          delete stored[data.tabId];
          saveStoredInstances(stored);
          updateDisplay();
        }
      };
      localChannel.postMessage({ type: "join", tabId, timestamp: Date.now() });
    } catch (e) {}
  }

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      updateDisplay();
    }
  });

  function heartbeat() {
    recalculateLocal();
    if (localChannel) {
      try { localChannel.postMessage({ type: "heartbeat", tabId, timestamp: Date.now() }); } catch (e) {}
    }
    if (wsClient) {
      wsClient.publish({ event: "ping", id: tabId });
    }
    updateDisplay();
  }

  function cleanup() {
    try {
      const stored = getStoredInstances();
      delete stored[tabId];
      saveStoredInstances(stored);
      if (localChannel) {
        localChannel.postMessage({ type: "leave", tabId });
      }
      if (wsClient) {
        wsClient.close();
      }
    } catch (e) {}
  }

  recalculateLocal();
  connectWebSocket();
  setInterval(heartbeat, 3000);

  window.addEventListener("beforeunload", cleanup);
  window.addEventListener("pagehide", cleanup);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      heartbeat();
    }
  });
})();

const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function toDevanagari(str) {
  return String(str).replace(/\d/g, (d) => devanagariDigits[d]);
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  els.clock.textContent = toDevanagari(`${h}:${m}`);
}
updateClock();
setInterval(updateClock, 1000);

function triggerPlay() {
  if (els.audio && els.audio.paused) {
    els.audio.play().then(() => {
      setPlayingUI(true);
    }).catch((err) => {
      // Browser requires user interaction before audio plays
      console.log("Autoplay waiting for user interaction:", err);
    });
  }
}

// Cinematic First-Load Initialization Choreography: Image -> Components -> Padding -> Song Start
function playIntroAnimation() {
  document.documentElement.classList.add("intro-no-padding", "intro-hidden");
  document.body.classList.add("intro-no-padding", "intro-hidden");
  void document.body.offsetHeight;

  // Stage 1: Components smoothly slide into frame with staggered spring curves
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.documentElement.classList.remove("intro-hidden");
      document.body.classList.remove("intro-hidden");
    }, 200);
  });

  // Stage 2: Frame padding smoothly settles into place
  setTimeout(() => {
    document.documentElement.classList.remove("intro-no-padding");
    document.body.classList.remove("intro-no-padding");
  }, 1300);

  // Stage 3: Song starts playing
  setTimeout(() => {
    triggerPlay();
  }, 1900);
}

const hasIntroPlayed = sessionStorage.getItem("has_intro_played");

if (!hasIntroPlayed) {
  load(0, false);
  requestAnimationFrame(tick);
  playIntroAnimation();
  sessionStorage.setItem("has_intro_played", "true");
} else {
  load(0, true);
  requestAnimationFrame(tick);
}

// Secret Keyboard Listener: Type "4772" anytime to replay the intro animation
let secretKeyBuffer = "";
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  secretKeyBuffer += e.key;
  if (secretKeyBuffer.length > 8) secretKeyBuffer = secretKeyBuffer.slice(-8);
  if (secretKeyBuffer.endsWith("4772")) {
    secretKeyBuffer = "";
    playIntroAnimation();
  }
});

// Capture-phase gesture unlocker to immediately play if browser blocked unmuted autoplay
const unlockEvents = ["click", "keydown", "touchstart", "pointerdown", "mousedown"];
function handleUserUnlock() {
  triggerPlay();
}
unlockEvents.forEach((evt) => {
  window.addEventListener(evt, handleUserUnlock, { capture: true, passive: true });
});

if (els.audio) {
  els.audio.addEventListener("playing", () => {
    setPlayingUI(true);
    unlockEvents.forEach((evt) => {
      window.removeEventListener(evt, handleUserUnlock, true);
    });
  });
}

// Warm Highway Dust Particles Atmosphere
(function initDust() {
  const canvas = document.getElementById("dust-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width, height;
  const particleCount = 95;
  const particles = [];

  function resize() {
    const parent = canvas.parentElement;
    width = canvas.width = parent ? parent.clientWidth : window.innerWidth;
    height = canvas.height = parent ? parent.clientHeight : window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  for (let i = 0; i < particleCount; i++) {
    const isBokeh = Math.random() < 0.12;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: isBokeh ? Math.random() * 2.5 + 2.0 : Math.random() * 1.6 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.35 - 0.1,
      baseAlpha: isBokeh ? Math.random() * 0.2 + 0.1 : Math.random() * 0.45 + 0.18,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.025 + 0.008,
      sway: Math.random() * 0.35 + 0.15
    });
  }

  function renderDust() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.phase += p.phaseSpeed;
      p.x += p.vx + Math.sin(p.phase) * p.sway;
      p.y += p.vy;

      if (p.y < -12) {
        p.y = height + 12;
        p.x = Math.random() * width;
      }
      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;

      const alpha = p.baseAlpha * (0.65 + 0.35 * Math.sin(p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 225, 150, ${alpha})`;
      ctx.shadowBlur = p.r > 2 ? 8 : 4;
      ctx.shadowColor = `rgba(255, 200, 100, ${alpha * 0.9})`;
      ctx.fill();
    }
    requestAnimationFrame(renderDust);
  }
  requestAnimationFrame(renderDust);
})();

// MagicUI Animated Theme Toggler with Symmetrical 2-Way Procedural Loop
(function initThemeToggler() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const dayLayer = document.querySelector(".hero-day");
  const nightLayer = document.querySelector(".hero-night");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    if (nightLayer) {
      nightLayer.style.zIndex = "2";
      nightLayer.style.clipPath = "circle(160% at 100% 0%)";
    }
    if (dayLayer) {
      dayLayer.style.zIndex = "1";
      dayLayer.style.clipPath = "none";
    }
  } else {
    if (dayLayer) {
      dayLayer.style.zIndex = "2";
      dayLayer.style.clipPath = "none";
    }
    if (nightLayer) {
      nightLayer.style.zIndex = "1";
      nightLayer.style.clipPath = "circle(0% at 100% 0%)";
    }
  }

  let isTransitioning = false;

  btn.addEventListener("click", () => {
    if (isTransitioning) return;
    isTransitioning = true;

    const willBeDark = !document.documentElement.classList.contains("dark");
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const applyTheme = () => {
      document.documentElement.classList.toggle("dark", willBeDark);
      localStorage.setItem("theme", willBeDark ? "dark" : "light");
    };

    if (typeof document.startViewTransition !== "function") {
      applyTheme();
      if (willBeDark) {
        if (nightLayer) {
          nightLayer.style.zIndex = "2";
          nightLayer.style.clipPath = "circle(160% at 100% 0%)";
        }
        if (dayLayer) dayLayer.style.zIndex = "1";
      } else {
        if (dayLayer) {
          dayLayer.style.zIndex = "2";
          dayLayer.style.clipPath = "none";
        }
        if (nightLayer) {
          nightLayer.style.zIndex = "1";
          nightLayer.style.clipPath = "circle(0% at 100% 0%)";
        }
      }
      isTransitioning = false;
      return;
    }

    const toX = (val) => `${(val / viewportWidth) * 100}%`;
    const toY = (val) => `${(val / viewportHeight) * 100}%`;
    const toRadius = (r) =>
      `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

    const clipPath = [
      `circle(0% at ${toX(x)} ${toY(y)})`,
      `circle(${toRadius(maxRadius)} at ${toX(x)} ${toY(y)})`
    ];

    // Stage 1: UI & Bezel wave from bottom-left to top-right
    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    if (transition && transition.ready) {
      transition.ready.then(() => {
        const anim = document.documentElement.animate(
          { clipPath },
          {
            duration: 420,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)"
          }
        );

        // Stage 2: When Stage 1 reaches top-right, trigger reverse wave changing the background picture from top-right
        anim.onfinish = () => {
          if (willBeDark && nightLayer) {
            // Light -> Dark: nightLayer expands from top-right over dayLayer
            nightLayer.style.zIndex = "3";
            const imgAnim = nightLayer.animate(
              [
                { clipPath: "circle(0% at 100% 0%)" },
                { clipPath: "circle(160% at 100% 0%)" }
              ],
              {
                duration: 550,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                fill: "forwards"
              }
            );

            imgAnim.onfinish = () => {
              nightLayer.style.clipPath = "circle(160% at 100% 0%)";
              nightLayer.style.zIndex = "2";
              if (dayLayer) dayLayer.style.zIndex = "1";
              isTransitioning = false;
            };
          } else if (!willBeDark && dayLayer) {
            // Dark -> Light: dayLayer expands from top-right over nightLayer with EXACT SAME SPEED AND MOTION
            dayLayer.style.zIndex = "3";
            const imgAnim = dayLayer.animate(
              [
                { clipPath: "circle(0% at 100% 0%)" },
                { clipPath: "circle(160% at 100% 0%)" }
              ],
              {
                duration: 550,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                fill: "forwards"
              }
            );

            imgAnim.onfinish = () => {
              dayLayer.style.clipPath = "none";
              dayLayer.style.zIndex = "2";
              if (nightLayer) {
                nightLayer.style.zIndex = "1";
                nightLayer.style.clipPath = "circle(0% at 100% 0%)";
              }
              isTransitioning = false;
            };
          } else {
            isTransitioning = false;
          }
        };
      });
    } else {
      isTransitioning = false;
    }
  });
})();
