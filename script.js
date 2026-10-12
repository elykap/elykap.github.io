/* Kyle Poota — portfolio behavior */
(function () {
  "use strict";

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Theme toggle — light / dark, persisted */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#12161c" : "#f0f2f4");
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  if (!root.getAttribute("data-theme")) applyTheme(systemTheme());
  else applyTheme(currentTheme());

  themeToggle?.addEventListener("click", function () {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (e) {}
    applyTheme(next);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    try {
      if (localStorage.getItem("theme")) return;
    } catch (err) {}
    applyTheme(e.matches ? "dark" : "light");
  });

  /* Viewer loads /public_resume.pdf from the Pages deploy (Action copies
     it from the latest Release). Download links straight to Releases. */
  const RESUME_RELEASE =
    "https://github.com/elykap/elykap.github.io/releases/latest/download/public_resume.pdf";
  const RESUME_SITE = "public_resume.pdf";
  const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69";

  const modal = document.getElementById("resumeModal");
  const viewer = document.getElementById("resumeViewer");
  const closeBtn = document.getElementById("resumeClose");
  const downloadBtn = document.getElementById("resumeDownload");
  const openBtn = document.getElementById("resumeOpen");
  const statusEl = document.getElementById("resumeStatus");
  const fallbackEl = document.getElementById("resumeFallback");
  const resumeLinks = document.querySelectorAll(".js-resume-link");

  if (!modal || !viewer || !resumeLinks.length) return;

  let pdfjsLib = null;
  let cachedBuffer = null;
  let lastFocus = null;
  let loading = false;

  function showStatus(text) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.hidden = false;
  }

  function hideStatus() {
    if (statusEl) statusEl.hidden = true;
  }

  function showFallback() {
    viewer.hidden = true;
    viewer.innerHTML = "";
    if (fallbackEl) fallbackEl.hidden = false;
    hideStatus();
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeBtn?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;
    pdfjsLib = await import(PDFJS_CDN + "/pdf.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN + "/pdf.worker.min.mjs";
    return pdfjsLib;
  }

  async function fetchBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("bad status");
    return res.arrayBuffer();
  }

  async function renderPdf(buffer) {
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: buffer.slice(0) }).promise;
    viewer.innerHTML = "";
    viewer.hidden = false;
    if (fallbackEl) fallbackEl.hidden = true;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const unscaled = page.getViewport({ scale: 1 });
      const width = Math.min(viewer.clientWidth || 800, 900);
      const scale = width / unscaled.width;
      const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = width + "px";
      canvas.style.height = unscaled.height * scale + "px";
      viewer.appendChild(canvas);
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    }
  }

  async function openResume() {
    if (loading) return;
    openModal();
    if (downloadBtn) downloadBtn.href = RESUME_RELEASE;
    if (openBtn) openBtn.href = RESUME_RELEASE;

    if (cachedBuffer) {
      showStatus("Loading resume…");
      try {
        await renderPdf(cachedBuffer);
        hideStatus();
      } catch (err) {
        showFallback();
      }
      return;
    }

    loading = true;
    showStatus("Loading resume…");
    viewer.hidden = true;
    if (fallbackEl) fallbackEl.hidden = true;

    try {
      cachedBuffer = await fetchBuffer(RESUME_SITE);
      await renderPdf(cachedBuffer);
      hideStatus();
    } catch (err) {
      cachedBuffer = null;
      showFallback();
    } finally {
      loading = false;
    }
  }

  resumeLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      openResume();
    });
  });

  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
})();
