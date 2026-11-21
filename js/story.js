
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) document.documentElement.classList.add("is-reduced");

  const canvas = document.getElementById("fx");
  const film = document.getElementById("film");
  if (!film) return;

  const rain = setupRain(canvas, reduced);
  const hint = document.querySelector(".scroll-hint");

  if (reduced) {
    if (rain) rain.setIntensity(0);
    exposeFilmProgress(0.99);
    return;
  }

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    document.documentElement.classList.add("is-reduced");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lines = gsap.utils.toArray(".film-line");
  gsap.set(lines, { autoAlpha: 0, y: 28, filter: "blur(10px)" });
  gsap.set("#finale", { autoAlpha: 0, y: 16 });
  gsap.set(".path-split", { autoAlpha: 0, y: 36 });
  gsap.set(".window", { autoAlpha: 1, scale: 1 });
  gsap.set(".horizon", { autoAlpha: 0 });
  gsap.set(".sun", { autoAlpha: 0, y: 80, scale: 0.6 });
  gsap.set(".sky-indigo, .sky-rose, .sky-gold", { opacity: 0 });
  gsap.set("#line1", { autoAlpha: 1, y: 0, filter: "blur(0px)" });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#film",
      start: "top top",
      end: "+=640%",
      scrub: 0.7,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        document.documentElement.style.setProperty("--p", self.progress.toFixed(4));
        const intensity = Math.max(0, 1 - self.progress * 1.35);
        if (rain) rain.setIntensity(intensity);
        if (hint) hint.style.opacity = String(Math.max(0, 1 - self.progress * 6));
      }
    }
  });

  // Opening already holds the night, the window, and the first line.
  tl.to("#line1", { autoAlpha: 1, duration: 0.08 }, 0.0)
    .to("#line1", { autoAlpha: 0, y: -18, filter: "blur(8px)", duration: 0.08 }, 0.14)
    // 0.18–0.30  second line
    .to("#line2", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1 }, 0.18)
    .to(".sky-indigo", { opacity: 0.55, duration: 0.12 }, 0.22)
    .to("#line2", { autoAlpha: 0, y: -18, filter: "blur(8px)", duration: 0.08 }, 0.30)
    // 0.32–0.48  turning point, pre-dawn
    .to(".sky-indigo", { opacity: 1, duration: 0.1 }, 0.32)
    .to(".window", { autoAlpha: 0.15, duration: 0.12 }, 0.34)
    .to(".horizon", { autoAlpha: 1, duration: 0.12 }, 0.34)
    .to("#line3", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1 }, 0.34)
    .to("#line3", { autoAlpha: 0, y: -18, filter: "blur(8px)", duration: 0.08 }, 0.46)
    // 0.48–0.62  rose dawn
    .to(".sky-rose", { opacity: 1, duration: 0.12 }, 0.48)
    .to(".sun", { autoAlpha: 0.7, y: 40, scale: 0.8, duration: 0.12 }, 0.5)
    .to("#line4", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1 }, 0.5)
    .to("#line4", { autoAlpha: 0, y: -18, filter: "blur(8px)", duration: 0.08 }, 0.62)
    // 0.64–0.78  "This could be yours."
    .to(".sky-gold", { opacity: 0.75, duration: 0.12 }, 0.64)
    .to(".sun", { autoAlpha: 1, y: 0, scale: 1, duration: 0.14 }, 0.64)
    .to(".vignette", { opacity: 0.35, duration: 0.14 }, 0.64)
    .to("#line5", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1 }, 0.66)
    .to("#line5 span", { y: 0, autoAlpha: 1, duration: 0.06, stagger: 0.02 }, 0.66)
    .to("#line5", { autoAlpha: 0, y: -16, filter: "blur(6px)", duration: 0.08 }, 0.78)
    // 0.80–1.00  sunrise, brand, two paths
    .to(".sky-gold", { opacity: 1, duration: 0.1 }, 0.8)
    .to(".sky-night", { opacity: 0, duration: 0.1 }, 0.8)
    .to(".sky-indigo", { opacity: 0, duration: 0.1 }, 0.8)
    .to(".sky-rose", { opacity: 0.35, duration: 0.1 }, 0.8)
    .to(".window", { autoAlpha: 0, duration: 0.08 }, 0.8)
    .to("#finale", { autoAlpha: 1, y: 0, duration: 0.1 }, 0.82)
    .to("#line6", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.08 }, 0.82)
    .to(".path-split", { autoAlpha: 1, y: 0, duration: 0.12 }, 0.88);

  window.__filmGo = function (progress) {
    const st = tl.scrollTrigger;
    if (!st) return;
    const p = Math.min(1, Math.max(0, progress));
    const y = st.start + (st.end - st.start) * p;
    st.scroll(y);
    tl.progress(p);
    document.documentElement.style.setProperty("--p", String(p));
    if (rain) rain.setIntensity(Math.max(0, 1 - p * 1.35));
    if (hint) hint.style.opacity = String(Math.max(0, 1 - p * 6));
  };

  function exposeFilmProgress(p) {
    document.documentElement.style.setProperty("--p", String(p));
  }
})();

function setupRain(canvas, reduced) {
  if (!canvas || reduced) return { setIntensity: function () {} };
  const ctx = canvas.getContext("2d", { alpha: true });
  const mobile = window.matchMedia("(max-width: 700px)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  let width = 0, height = 0, intensity = 1, drops = [], raf = 0, running = true;

  function resize() {
    width = canvas.width = Math.floor(window.innerWidth * dpr);
    height = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const count = Math.floor((mobile ? 55 : 130) * Math.max(0.2, intensity));
    drops = Array.from({ length: count }, newDrop);
  }
  function newDrop() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      len: (8 + Math.random() * 14) * dpr,
      spd: (4 + Math.random() * 8) * dpr,
      opa: 0.12 + Math.random() * 0.28
    };
  }
  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    if (intensity > 0.02) {
      ctx.strokeStyle = "rgba(210, 220, 230, 0.7)";
      ctx.lineWidth = 1 * dpr;
      ctx.lineCap = "round";
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.globalAlpha = d.opa * intensity;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 0.6 * dpr, d.y + d.len);
        ctx.stroke();
        d.y += d.spd * (0.7 + intensity);
        d.x += 0.35 * dpr;
        if (d.y > height || d.x > width) {
          d.x = Math.random() * width;
          d.y = -d.len;
        }
      }
      ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", function () {
    running = document.visibilityState !== "hidden";
    if (running) tick();
    else cancelAnimationFrame(raf);
  });
  resize();
  tick();
  return {
    setIntensity: function (v) {
      intensity = Math.max(0, Math.min(1, v));
    }
  };
}
