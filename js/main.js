/* ============================================
   陈欣语 · 个人主页 交互脚本
   1. 导航滑动指示器 + 滚动高亮
   2. 顶部滚动进度条
   3. 卡片鼠标聚光 / 作品卡 3D 微倾斜
   4. 滚动渐入动画
   ============================================ */
(function () {
  "use strict";

  const nav = document.querySelector(".nav");
  const navInner = document.querySelector(".nav-inner");
  const navPill = document.querySelector(".nav-pill");
  const navProgress = document.querySelector(".nav-progress");
  const links = Array.from(document.querySelectorAll(".nav-link"));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 1. 导航指示器 ---------- */
  const sections = links
    .map((link) => {
      const id = link.getAttribute("href");
      const el = id && id.startsWith("#") ? document.querySelector(id) : null;
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  function movePill(link) {
    if (!navPill || !navInner || !link) return;
    const linkRect = link.getBoundingClientRect();
    const innerRect = navInner.getBoundingClientRect();
    navPill.style.width = linkRect.width + "px";
    navPill.style.left = linkRect.left - innerRect.left + navInner.scrollLeft + "px";

    if (!navPill.classList.contains("ready")) {
      navPill.classList.add("ready");
      links.forEach((l) => l.classList.add("pill-on"));
    }
  }

  function revealActiveLink(link) {
    // 手机上导航可横向滚动，保证当前项可见
    if (!navInner || navInner.scrollWidth <= navInner.clientWidth + 4) return;
    const target = link.offsetLeft - (navInner.clientWidth - link.offsetWidth) / 2;
    navInner.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? "auto" : "smooth" });
  }

  let activeLink = links.find((l) => l.classList.contains("active")) || links[0];

  function setActive(link) {
    if (!link || link === activeLink) return;
    activeLink = link;
    links.forEach((l) => l.classList.toggle("active", l === link));
    movePill(link);
    revealActiveLink(link);
  }

  /* ---------- 2. 滚动：进度条 / 导航高亮 ---------- */
  let ticking = false;

  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (navProgress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      navProgress.style.transform = "scaleX(" + ratio + ")";
    }

    if (nav) nav.classList.toggle("scrolled", scrollTop > 12);

    // 以导航栏下沿 + 一段偏移作为「当前阅读线」
    const line = scrollTop + (nav ? nav.offsetHeight : 0) + 60;
    let current = sections[0];

    for (const item of sections) {
      if (item.el.offsetTop <= line) current = item;
    }

    // 到底部时强制高亮最后一项
    if (window.innerHeight + scrollTop >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }

    if (current) setActive(current.link);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", function () {
    movePill(activeLink);
  });

  /* ---------- 3. 鼠标聚光 / 卡片倾斜 ---------- */
  if (finePointer) {
    document.querySelectorAll(".card, .work").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        el.style.setProperty("--mx", x + "px");
        el.style.setProperty("--my", y + "px");

        if (el.classList.contains("work") && !reduceMotion) {
          const rx = ((y / rect.height) - 0.5) * -7;
          const ry = ((x / rect.width) - 0.5) * 7;
          el.style.transform =
            "translateY(-6px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        }
      });

      el.addEventListener("pointerleave", () => {
        if (el.classList.contains("work")) el.style.transform = "";
      });
    });
  }

  /* ---------- 4. 滚动渐入 ---------- */
  const revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((el) => io.observe(el));
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (activeLink) {
      links.forEach((l) => l.classList.add("pill-on"));
      movePill(activeLink);
    }
    onScroll();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
  // 字体/图片加载完成后宽度可能变化，再校准一次
  window.addEventListener("load", () => movePill(activeLink));
})();
