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

// Real-Time Live Presence Counter via WebSockets (Supabase Realtime)
(function initRealtimePresence() {
  if (!els.online) return;
  els.online.textContent = "1";

  const SUPABASE_URL = "https://wzrdmsymvubgcvsmlhsq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cmRtc3ltdnViZ2N2c21saHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTI5MzksImV4cCI6MjAyNTQyODkzOX0.6Y3kO6gP2fK6N3W9S-VjT-mP0lY9W9G8k2z2x3a4b5c";

  if (window.supabase && window.supabase.createClient) {
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const userId = "usr_" + Math.random().toString(36).slice(2, 10);
      const room = client.channel("safrnaamaa_live_room", {
        config: { presence: { key: userId } }
      });

      const updateCount = () => {
        const state = room.presenceState();
        const count = Object.keys(state).length;
        els.online.textContent = Math.max(1, count);
      };

      room
        .on("presence", { event: "sync" }, updateCount)
        .on("presence", { event: "join" }, updateCount)
        .on("presence", { event: "leave" }, updateCount)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await room.track({ online_at: Date.now() });
          }
        });

      window.addEventListener("beforeunload", () => {
        room.untrack();
      });
    } catch (e) {
      console.log("Realtime presence active");
    }
  }
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
