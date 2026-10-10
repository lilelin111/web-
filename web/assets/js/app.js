const fallbackPageData = {
  video: {
    url: "/assets/video/intro.mp4",
    shrinkWidth: 260,
    shrinkHeight: 146,
    shirnkTop: 40,
    shirnkLeft: 40,
    durationMs: 900
  },
  map: [
    { PointName: "成都", PointEnglishName: "Chengdu", URL: "https://baike.baidu.com/item/%E6%88%90%E9%83%BD" },
    { PointName: "绵阳", PointEnglishName: "Mianyang", URL: "https://baike.baidu.com/item/%E7%BB%B5%E9%98%B3" },
    { PointName: "乐山", PointEnglishName: "Leshan", URL: "https://baike.baidu.com/item/%E4%B9%90%E5%B1%B1" },
    { PointName: "宜宾", PointEnglishName: "Yibin", URL: "https://baike.baidu.com/item/%E5%AE%9C%E5%AE%BE" },
    { PointName: "南充", PointEnglishName: "Nanchong", URL: "https://baike.baidu.com/item/%E5%8D%97%E5%85%85" },
    { PointName: "阿坝", PointEnglishName: "Aba", URL: "https://baike.baidu.com/item/%E9%98%BF%E5%9D%9D%E5%B7%9E" },
    { PointName: "甘孜", PointEnglishName: "Ganzi", URL: "https://baike.baidu.com/item/%E7%94%98%E5%AD%9C%E5%B7%9E" },
    { PointName: "凉山", PointEnglishName: "Liangshan", URL: "https://baike.baidu.com/item/%E5%87%89%E5%B1%B1%E5%B7%9E" }
  ],
  train: {
    images: [
      { url: "/assets/images/train-1.jpg", triggerX: 120, fadeDurationMs: 800, animation: "fade-up", text: "天府成都", textStartX: 100, textEndX: -100, textMoveDurationMs: 1600, textFloatArea: "image", textFloatDistance: 10, textFloatDurationMs: 1800, textOnlyInView: true },
      { url: "/assets/images/train-2.jpg", triggerX: 360, fadeDurationMs: 900, animation: "zoom-in", text: "山水四川", textStartX: 120, textEndX: -120, textMoveDurationMs: 1800, textFloatArea: "image", textFloatDistance: 12, textFloatDurationMs: 2000, textOnlyInView: true },
      { url: "/assets/images/train-3.jpg", triggerX: 620, fadeDurationMs: 1000, animation: "fade-right", text: "继续向前", textStartX: 140, textEndX: -140, textMoveDurationMs: 2000, textFloatArea: "image", textFloatDistance: 14, textFloatDurationMs: 2200, textOnlyInView: true }
    ],
    speed: 3,
    followFactor: 0.18,
    mouseAxis: "xy",
    loop: true
  }
};

const cityLayout = {
  Chengdu: { x: 42, y: 53 },
  Mianyang: { x: 55, y: 38 },
  Leshan: { x: 37, y: 66 },
  Yibin: { x: 45, y: 79 },
  Nanchong: { x: 68, y: 48 },
  Aba: { x: 28, y: 27 },
  Ganzi: { x: 14, y: 44 },
  Liangshan: { x: 29, y: 79 }
};

const state = {
  introDone: false,
  fallbackTimer: 0,
  trainConfig: fallbackPageData.train,
  trainItems: [],
  trainX: -120,
  followX: 0,
  followY: 0,
  targetFollowX: 0,
  targetFollowY: 0,
  lastFrame: 0,
  trainFrame: 0,
  stageInView: false
};

const videoStage = document.querySelector("#video-stage");
const introSection = document.querySelector("#intro");
const video = document.querySelector("#intro-video");
const videoFallback = document.querySelector("#video-fallback");
const fallbackPlay = document.querySelector("#fallback-play");
const mapPoints = document.querySelector("#map-points");
const trainStage = document.querySelector("#train-stage");
const trainTrack = document.querySelector("#train-track");
const trainElement = document.querySelector("#train");
const trainImages = document.querySelector("#train-images");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setCssNumber(name, value) {
  document.documentElement.style.setProperty(name, `${Number(value) || 0}px`);
}

async function loadPageData() {
  const pageData = await fetchJson("/api/page-data");

  if (pageData) {
    return {
      video: pageData.video || fallbackPageData.video,
      map: Array.isArray(pageData.map) && pageData.map.length ? pageData.map : fallbackPageData.map,
      train: pageData.train || fallbackPageData.train
    };
  }

  const [videoData, mapData, trainData] = await Promise.all([
    fetchJson("/api/vodeo-config"),
    fetchJson("/api/locations"),
    fetchJson("/api/train-config")
  ]);

  return {
    video: videoData || fallbackPageData.video,
    map: Array.isArray(mapData) && mapData.length ? mapData : fallbackPageData.map,
    train: trainData || fallbackPageData.train
  };
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

function applyVideoConfig(config) {
  const top = config.shirnkTop ?? config.shrinkTop ?? 40;
  const left = config.shirnkLeft ?? config.shrinkLeft ?? 40;
  const width = config.shrinkWidth ?? 260;
  const height = config.shrinkHeight ?? 146;
  const duration = config.durationMs ?? 900;

  setCssNumber("--shrink-top", top);
  setCssNumber("--shrink-left", left);
  setCssNumber("--shrink-width", width);
  setCssNumber("--shrink-height", height);
  setCssNumber("--companion-left", left + width + 16);
  document.documentElement.style.setProperty("--shrink-duration", `${duration}ms`);

  const source = video.querySelector("source");
  if (source && config.url) {
    source.src = config.url;
    video.load();
  }
}

function finishIntro() {
  if (state.introDone) {
    return;
  }

  state.introDone = true;
  window.clearTimeout(state.fallbackTimer);
  video.pause();
  videoStage.classList.add("is-shrunk");
  introSection.classList.add("is-shrunk");
  document.body.classList.remove("is-intro-locked");
}

function showVideoFallback() {
  if (state.introDone || !videoFallback.hidden) {
    return;
  }

  videoFallback.hidden = false;
  video.style.opacity = "0";
  state.fallbackTimer = window.setTimeout(finishIntro, 2800);
}

function bindVideoEvents() {
  video.addEventListener("ended", finishIntro);
  video.addEventListener("error", showVideoFallback);
  fallbackPlay.addEventListener("click", finishIntro);

  video.play().catch(showVideoFallback);
  window.setTimeout(() => {
    if (!state.introDone && (video.readyState < 2 || video.paused)) {
      showVideoFallback();
    }
  }, 1400);
}

function normalizeMapPoints(points) {
  return points.map((point, index) => {
    const englishName = point.PointEnglishName || point.englishName || point.name || `Point ${index + 1}`;
    const name = point.PointName || point.name || englishName;
    const layout = cityLayout[englishName] || {
      x: 22 + (index % 4) * 18,
      y: 26 + Math.floor(index / 4) * 22
    };
    const url = point.URL || point.url || `https://www.baidu.com/s?wd=${encodeURIComponent(`四川 ${name}`)}`;

    return { name, url, x: layout.x, y: layout.y };
  });
}

function renderMap(points) {
  mapPoints.replaceChildren();
  normalizeMapPoints(points).forEach((point) => {
    const button = document.createElement("button");
    const dot = document.createElement("span");
    const label = document.createElement("span");

    button.type = "button";
    button.className = "map-point";
    button.style.setProperty("--x", point.x);
    button.style.setProperty("--y", point.y);
    button.setAttribute("aria-label", `打开${point.name}`);
    dot.className = "map-dot";
    label.className = "map-label";
    label.textContent = point.name;
    button.append(dot, label);
    button.addEventListener("click", () => {
      window.open(point.url, "_blank", "noopener,noreferrer");
    });
    mapPoints.append(button);
  });
}

function createTrainImage(config, index) {
  const figure = document.createElement("figure");
  const image = document.createElement("img");
  const text = document.createElement("figcaption");
  const enterDuration = config.fadeDurationMs ?? 800;
  const textMoveDuration = config.textMoveDurationMs ?? 1800;
  const floatDistance = config.textFloatDistance ?? 10;
  const floatDuration = config.textFloatDurationMs ?? 1800;

  figure.className = "train-image";
  figure.dataset.triggerX = config.triggerX ?? 120 + index * 220;
  figure.style.left = `${Number(figure.dataset.triggerX)}px`;
  figure.style.setProperty("--enter-duration", `${enterDuration}ms`);
  figure.style.setProperty("--text-start-x", `${config.textStartX ?? 120}px`);
  figure.style.setProperty("--text-end-x", `${config.textEndX ?? -120}px`);
  figure.style.setProperty("--text-move-duration", `${textMoveDuration}ms`);
  figure.style.setProperty("--float-distance", `${floatDistance}px`);
  figure.style.setProperty("--float-duration", `${floatDuration}ms`);

  image.src = config.url || `/assets/images/train-${index + 1}.jpg`;
  image.alt = "";
  text.className = "train-image-text";
  text.textContent = config.text || "";
  figure.append(image, text);

  return figure;
}

function renderTrainImages(config) {
  trainImages.replaceChildren();
  state.trainItems = [];

  const images = Array.isArray(config.images) && config.images.length ? config.images : fallbackPageData.train.images;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = state.trainItems.find((candidate) => candidate.element === entry.target);
      if (!item) {
        return;
      }

      item.inView = entry.isIntersecting;
      item.element.classList.toggle("is-in-view", entry.isIntersecting);
      if (entry.isIntersecting && item.pendingTextStart) {
        item.pendingTextStart = false;
        startTextSequence(item);
      }
    });
  }, { threshold: 0.35 });

  images.forEach((imageConfig, index) => {
    const element = createTrainImage(imageConfig, index);
    const item = {
      element,
      config: imageConfig,
      revealed: false,
      inView: false,
      textStarted: false,
      pendingTextStart: false,
      timers: []
    };

    observer.observe(element);
    trainImages.append(element);
    state.trainItems.push(item);
  });
}

function revealTrainImage(item) {
  if (item.revealed) {
    return;
  }

  item.revealed = true;
  item.element.classList.add("is-visible");
  const fadeDuration = item.config.fadeDurationMs ?? 800;
  const timer = window.setTimeout(() => {
    if (item.config.textOnlyInView && !item.inView) {
      item.pendingTextStart = true;
      return;
    }
    startTextSequence(item);
  }, fadeDuration);
  item.timers.push(timer);
}

function startTextSequence(item) {
  if (item.textStarted) {
    return;
  }

  item.textStarted = true;
  item.element.classList.add("is-text-moving");
  const moveTimer = window.setTimeout(() => {
    item.element.classList.add("is-text-floating");
  }, item.config.textMoveDurationMs ?? 1800);
  item.timers.push(moveTimer);
}

function resetTrainImages() {
  state.trainItems.forEach((item) => {
    item.timers.forEach((timer) => window.clearTimeout(timer));
    item.timers = [];
    item.revealed = false;
    item.textStarted = false;
    item.pendingTextStart = false;
    item.element.classList.remove("is-visible", "is-text-moving", "is-text-floating");
  });
}

function updateTrainPosition(deltaRatio) {
  const speed = Number(state.trainConfig.speed) || 3;
  const trackWidth = trainTrack.offsetWidth;
  state.trainX += speed * deltaRatio;

  if (state.trainX > trackWidth + 120) {
    if (state.trainConfig.loop === false) {
      state.trainX = trackWidth + 120;
    } else {
      state.trainX = -120;
      resetTrainImages();
    }
  }

  trainElement.style.left = `${state.trainX}px`;
  state.trainItems.forEach((item) => {
    if (state.trainX >= Number(item.element.dataset.triggerX)) {
      revealTrainImage(item);
    }
  });
}

function updateMouseFollow() {
  const factor = Number(state.trainConfig.followFactor) || 0.18;
  const axis = state.trainConfig.mouseAxis || "xy";
  state.followX += (state.targetFollowX - state.followX) * 0.08;
  state.followY += (state.targetFollowY - state.followY) * 0.08;
  trainElement.style.setProperty("--follow-x", `${state.followX}px`);
  trainElement.style.setProperty("--follow-y", `${axis.includes("y") ? state.followY : 0}px`);
  trainElement.style.setProperty("--follow-factor", factor);
}

function startTrainLoop() {
  if (state.trainFrame) {
    return;
  }

  const loop = (time) => {
    const delta = state.lastFrame ? time - state.lastFrame : 16.67;
    const deltaRatio = clamp(delta / 16.67, 0, 2.4);
    state.lastFrame = time;

    if (state.stageInView) {
      updateTrainPosition(deltaRatio);
      updateMouseFollow();
    }

    state.trainFrame = window.requestAnimationFrame(loop);
  };

  state.trainFrame = window.requestAnimationFrame(loop);
}

function bindTrainEvents() {
  trainStage.addEventListener("pointermove", (event) => {
    const rect = trainStage.getBoundingClientRect();
    const factor = Number(state.trainConfig.followFactor) || 0.18;
    const axis = state.trainConfig.mouseAxis || "xy";
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    state.targetFollowX = axis.includes("x") ? clamp((x - centerX) * factor, -90, 90) : 0;
    state.targetFollowY = axis.includes("y") ? clamp((y - centerY) * factor, -56, 56) : 0;
  });

  trainStage.addEventListener("pointerleave", () => {
    state.targetFollowX = 0;
    state.targetFollowY = 0;
  });

  const stageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      state.stageInView = entry.isIntersecting;
    });
  }, { threshold: 0.2 });
  stageObserver.observe(trainStage);
}

async function init() {
  const data = await loadPageData();
  applyVideoConfig(data.video);
  renderMap(data.map);
  state.trainConfig = data.train || fallbackPageData.train;
  renderTrainImages(state.trainConfig);
  bindVideoEvents();
  bindTrainEvents();
  startTrainLoop();
}

init();
