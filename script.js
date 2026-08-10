"use strict";

const dom = {
  entryGate: document.querySelector("#entryGate"),
  gateText: document.querySelector(".entry-gate__text"),
  gateCursor: document.querySelector(".entry-gate__cursor"),
  opening: document.querySelector("#openingText"),
  marqueeGroups: [...document.querySelectorAll(".marquee__group")],
  startButton: document.querySelector("#startButton"),
  letter: document.querySelector("#letter"),
  status: document.querySelector("#status"),
  backgroundMusic: document.querySelector("#backgroundMusic"),
  musicToggle: document.querySelector("#musicToggle"),
  lines: [...document.querySelectorAll(".message__line")],
};

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const lines = dom.lines.map((line) => ({
  line,
  text: line.textContent,
  pause: Number(line.dataset.pause) || 650,
}));

let runId = 0;
let reducedMotion = false; // Forced false to ensure animations run
let timerId = null;
let resolveWait = null;

function requireDom() {
  const required = [
    dom.entryGate,
    dom.opening,
    dom.startButton,
    dom.letter,
    dom.status,
    dom.backgroundMusic,
    dom.musicToggle,
    ...lines.map(({ line }) => line),
  ];
  if (required.some((element) => !element) || !lines.length) {
    throw new Error("Thiếu phần tử bắt buộc cho trải nghiệm mở thư.");
  }
}

function stopWaiting() {
  if (timerId !== null) window.clearTimeout(timerId);
  timerId = null;
  const resolve = resolveWait;
  resolveWait = null;
  resolve?.();
}

function wait(ms, id) {
  if (reducedMotion || id !== runId) return Promise.resolve();
  return new Promise((resolve) => {
    resolveWait = resolve;
    timerId = window.setTimeout(() => {
      timerId = null;
      resolveWait = null;
      resolve();
    }, ms);
  });
}

function resetContent() {
  lines.forEach(({ line }) => line.classList.remove("is-revealed"));
  dom.startButton.hidden = false;
  dom.startButton.disabled = false;
  dom.startButton.setAttribute("aria-expanded", "false");
  dom.letter.setAttribute("aria-busy", "false");
}

function updateMusicToggle() {
  const isPlaying = !dom.backgroundMusic.paused;
  dom.musicToggle.textContent = `Nhạc: ${isPlaying ? "Bật" : "Tắt"}`;
  dom.musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

async function playMusic() {
  if (!dom.backgroundMusic.hasAttribute("src")) return;
  try {
    await dom.backgroundMusic.play();
  } catch {
    updateMusicToggle();
    dom.status.textContent = "Trình duyệt chưa thể phát nhạc.";
  }
}

function toggleMusic() {
  if (!dom.backgroundMusic.hasAttribute("src")) return;
  if (dom.backgroundMusic.paused) void playMusic();
  else dom.backgroundMusic.pause();
}

function setupMusic() {
  dom.backgroundMusic.src = dom.backgroundMusic.dataset.localSrc;
  dom.musicToggle.hidden = false;
  dom.backgroundMusic.addEventListener("play", updateMusicToggle);
  dom.backgroundMusic.addEventListener("pause", updateMusicToggle);
  dom.backgroundMusic.addEventListener("error", () => {
    dom.musicToggle.textContent = "Nhạc: Lỗi";
    dom.musicToggle.disabled = true;
    dom.status.textContent = "Không tải được nhạc; lời nhắn vẫn hoạt động.";
  });
  updateMusicToggle();
}

let gateInteractionLocked = false;

function eraseGateText(callback) {
  if (!dom.gateText) { callback?.(); return; }
  const text = dom.gateText.textContent;
  let len = text.length;
  const speed = 55;

  function eraseChar() {
    if (len > 0) {
      len--;
      dom.gateText.textContent = text.substring(0, len);
      setTimeout(eraseChar, speed);
    } else {
      callback?.();
    }
  }

  eraseChar();
}

function typeNewGateMessage(msg, callback) {
  if (!dom.gateText) { callback?.(); return; }
  dom.gateText.textContent = "";
  let i = 0;
  const speed = 100;

  function typeChar() {
    if (i < msg.length) {
      dom.gateText.textContent = msg.substring(0, i + 1);
      i++;
      setTimeout(typeChar, speed);
    } else {
      callback?.();
    }
  }

  typeChar();
}

function finishGateTransition() {
  document.body.dataset.phase = "entering";
  dom.entryGate.classList.add("is-leaving");
  dom.status.textContent = "Đã bắt đầu trải nghiệm.";
  void playMusic();

  window.setTimeout(() => {
    if (document.body.dataset.phase !== "entering") return;
    dom.entryGate.hidden = true;
    document.body.dataset.phase = "idle";
    dom.startButton.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 900);
}

function enterExperience() {
  if (document.body.dataset.phase !== "gate" || gateInteractionLocked) return;
  gateInteractionLocked = true;
  document.removeEventListener("keydown", handleGateKeydown);

  if (reducedMotion) {
    finishGateTransition();
    return;
  }

  // Hide cursor during erase
  if (dom.gateCursor) dom.gateCursor.style.visibility = "hidden";

  eraseGateText(() => {
    // Wait, then type new message
    setTimeout(() => {
      typeNewGateMessage("Hi♪♪♪", () => {
        if (dom.gateCursor) dom.gateCursor.style.visibility = "visible";
        // Brief pause to let user read, then transition
        setTimeout(finishGateTransition, 800);
      });
    }, 600);
  });
}

function handleGateKeydown(event) {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.key === "Tab") return;
  event.preventDefault();
  enterExperience();
}

function closeLetter() {
  if (!["opening", "writing", "complete"].includes(document.body.dataset.phase)) return false;
  ++runId;
  stopWaiting();
  cleanupPetals();
  resetContent();
  document.body.dataset.phase = "idle";
  dom.status.textContent = "Lời nhắn đã đóng.";
  dom.startButton.focus({ preventScroll: true });
  return true;
}

function showComplete(id) {
  if (id !== runId) return;
  lines.forEach(({ line }) => line.classList.add("is-revealed"));
  document.body.dataset.phase = "complete";
  dom.letter.setAttribute("aria-busy", "false");
  dom.status.textContent = "Lời nhắn đã hiện đầy đủ.";
}

function spawnPetal() {
  const container = document.querySelector(".petals");
  if (!container) return;
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.style.left = Math.random() * 100 + "%";
  petal.style.animationDuration = (3.5 + Math.random() * 3) + "s";
  petal.style.animationDelay = Math.random() * 0.5 + "s";
  petal.style.setProperty("--drift", (Math.random() - 0.5) * 120 + "px");
  petal.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
  const size = 0.6 + Math.random() * 0.6;
  petal.style.setProperty("--size", size.toFixed(2));
  container.appendChild(petal);
  petal.addEventListener("animationend", () => petal.remove());
}

let petalInterval = null;

function startPetals() {
  if (petalInterval) return;
  // Burst of petals initially
  for (let i = 0; i < 12; i++) {
    setTimeout(spawnPetal, i * 150);
  }
  // Then continuous gentle petals
  petalInterval = setInterval(spawnPetal, 600);
}

function stopPetals() {
  if (petalInterval) {
    clearInterval(petalInterval);
    petalInterval = null;
  }
}

async function playMessage() {
  const id = ++runId;
  stopWaiting();
  resetContent();
  document.body.dataset.phase = "opening";
  dom.startButton.disabled = true;
  dom.startButton.setAttribute("aria-expanded", "true");
  dom.letter.setAttribute("aria-busy", "true");
  dom.status.textContent = "Đang mở phong bì.";

  if (reducedMotion) {
    showComplete(id);
    dom.letter.focus({ preventScroll: true });
    return;
  }

  await wait(1150, id);
  if (id !== runId) return;

  document.body.dataset.phase = "writing";
  dom.status.textContent = "Đang mở lời nhắn.";
  dom.letter.focus({ preventScroll: true });
  startPetals();

  await wait(420, id);
  for (const item of lines) {
    if (id !== runId) return;
    item.line.classList.add("is-revealed");
    await wait(item.pause, id);
  }

  showComplete(id);
  // Slow down petals after complete
  setTimeout(stopPetals, 4000);
}

function restoreFallback() {
  ++runId;
  stopWaiting();
  document.documentElement.removeAttribute("data-app-ready");
  document.body.dataset.phase = "error";
  lines.forEach(({ line }) => line.classList.add("is-revealed"));
  if (dom.entryGate) dom.entryGate.hidden = true;
  if (dom.backgroundMusic) dom.backgroundMusic.pause();
  if (dom.musicToggle) dom.musicToggle.hidden = true;
  if (dom.startButton) dom.startButton.hidden = true;
  if (dom.letter) dom.letter.setAttribute("aria-busy", "false");
}

function runSelfCheck() {
  if (!new URLSearchParams(window.location.search).has("check")) return;
  console.assert(lines.length === 3, "Cần đúng 3 đoạn nội dung.");
  console.assert(lines.every(({ text }) => text.trim().length > 0), "Mỗi đoạn phải có nội dung.");
  console.assert(dom.startButton.type === "button" && dom.replayButton.type === "button", "Điều khiển phải dùng button.");
  console.assert(dom.opening.textContent.replace(/\s+/g, " ").trim() === "Có một lời nhắn dành cho Tran Hanh", "Sai câu mở đầu.");
  console.assert(dom.marqueeGroups.length === 2 && dom.marqueeGroups[1].getAttribute("aria-hidden") === "true", "Marquee cần một bản sao ẩn.");
  console.assert(lines.at(-1).text.trim() === "See you tomorrow ♪", "Thiếu câu kết.");
  console.info("Self-check hoàn tất.");
}

/* typeGateText removed — text shows immediately like philia093 */

function cleanupPetals() {
  stopPetals();
  const container = document.querySelector(".petals");
  if (container) container.innerHTML = "";
}

class CanvasBackground {
  constructor() {
    this.canvas = document.getElementById("bgCanvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    
    this.symbols = [];
    this.stardust = [];
    this.symbolChars = ["♥", "♪", "✦", "✧"];
    
    this.resize();
    window.addEventListener("resize", () => this.resize());
    
    // Initial Stardust (dots)
    for (let i = 0; i < 150; i++) {
      this.stardust.push(this.createStar(true));
    }
    
    // Initial Symbols
    for (let i = 0; i < 25; i++) {
      this.symbols.push(this.createSymbol(true));
    }
    
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createStar(isInitial = false) {
    return {
      x: Math.random() * this.canvas.width,
      y: isInitial ? Math.random() * this.canvas.height : this.canvas.height + 10,
      size: Math.random() * 1.5 + 0.5,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.1,
      opacity: Math.random() * 0.5 + 0.2
    };
  }

  createSymbol(isInitial = false) {
    return {
      x: Math.random() * this.canvas.width,
      y: isInitial ? Math.random() * this.canvas.height : this.canvas.height + 50,
      size: Math.random() * 14 + 10, // 10px to 24px
      speedY: Math.random() * 0.6 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      life: 0,
      maxLife: Math.random() * 300 + 400,
      char: this.symbolChars[Math.floor(Math.random() * this.symbolChars.length)],
      opacity: Math.random() * 0.3 + 0.1,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01
    };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Maintain Stardust count
    if (this.stardust.length < 150) {
      this.stardust.push(this.createStar());
    }
    
    // Maintain Symbols count
    if (this.symbols.length < 35 && Math.random() < 0.02) {
      this.symbols.push(this.createSymbol());
    }
    
    // Draw Stardust (Dynamic Dots)
    this.ctx.fillStyle = "rgba(255, 237, 204, 0.8)";
    for (let i = 0; i < this.stardust.length; i++) {
      let p = this.stardust[i];
      p.y -= p.speedY;
      p.x += p.speedX;
      
      this.ctx.globalAlpha = p.opacity;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (p.y < -10) {
        this.stardust.splice(i, 1);
        i--;
      }
    }
    
    // Draw Symbols
    for (let i = 0; i < this.symbols.length; i++) {
      let p = this.symbols[i];
      p.life++;
      p.y -= p.speedY;
      p.x += Math.sin(p.sway) * 0.8 + p.speedX;
      p.sway += p.swaySpeed;
      p.rot += p.rotSpeed;
      
      let currentOpacity = p.opacity;
      if (p.life < 60) currentOpacity *= (p.life / 60);
      let fadeOutDist = 100;
      if (p.y < fadeOutDist) currentOpacity *= Math.max(0, p.y / fadeOutDist);
      
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      
      // Fixed font bug: Canvas requires standard font syntax, cannot use var()
      this.ctx.font = `${p.size}px "Segoe UI", sans-serif`;
      this.ctx.fillStyle = `rgba(215, 168, 95, ${currentOpacity})`;
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = `rgba(184, 95, 114, ${currentOpacity * 1.5})`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(p.char, 0, 0);
      
      this.ctx.restore();
      
      if (p.y < -50 || p.life > p.maxLife) {
        this.symbols.splice(i, 1);
        i--;
      }
    }
    
    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame(() => this.animate());
  }
}

let bgSystem = null;

function initBgParticles() {
  bgSystem = new CanvasBackground();
}

function init() {
  requireDom();
  resetContent();
  setupMusic();
  initBgParticles();
  dom.entryGate.hidden = false;
  /* Text shows immediately — no typing on load (philia093 style) */
  dom.entryGate.addEventListener("click", enterExperience, { once: true });
  document.addEventListener("keydown", handleGateKeydown);
  dom.musicToggle.addEventListener("click", toggleMusic);
  dom.startButton.addEventListener("click", playMessage);
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Node && !dom.letter.contains(target) && !dom.startButton.contains(target)) {
      closeLetter();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && closeLetter()) event.preventDefault();
  });
  motionQuery.addEventListener?.("change", (event) => {
    // reducedMotion = event.matches; // Disabled to force animations
  });
  document.documentElement.dataset.appReady = "true";
  runSelfCheck();
}

window.addEventListener("error", restoreFallback, { once: true });
window.addEventListener("unhandledrejection", restoreFallback, { once: true });

try {
  init();
} catch (error) {
  console.error(error);
  restoreFallback();
}
