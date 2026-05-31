/* =========================================================
   Sevi — UI-утилиты: помощники, тосты, окна, перетаскивание
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Тосты ---------- */
  let toastTimer = null;
  function toast(msg) {
    if (!Sevi.state.settings.notif) return;
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("toast--show"), 2400);
  }

  /* ---------- Иконки ---------- */
  function setIcon(btn, name) {
    const use = btn.querySelector("use");
    if (use) use.setAttribute("href", `#${name}`);
  }

  /* ---------- Окна (модалки) ---------- */
  const openStack = [];

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay || !overlay.hidden === true && openStack.includes(id)) { /* noop */ }
    overlay.hidden = false;
    if (!openStack.includes(id)) openStack.push(id);
  }

  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.hidden = true;
    const i = openStack.indexOf(id);
    if (i !== -1) openStack.splice(i, 1);
  }

  function closeTop() {
    if (openStack.length) closeModal(openStack[openStack.length - 1]);
  }

  // Закрытие по клику на фон, по кнопкам [data-close], по Esc
  function wireModals() {
    $$(".overlay").forEach((overlay) => {
      overlay.addEventListener("mousedown", (e) => {
        // закрываем только при клике именно по фону (не по окну)
        if (e.target === overlay) closeModal(overlay.id);
      });
    });
    $$("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeTop();
    });
  }

  /* ---------- Перетаскивание окон за заголовок ---------- */
  function makeDraggable(win) {
    const handle = win.querySelector("[data-drag-handle]");
    if (!handle) return;
    let startX = 0, startY = 0, baseX = 0, baseY = 0, dragging = false;

    const onDown = (e) => {
      // не таскаем, если кликнули по кнопке в шапке
      if (e.target.closest("button")) return;
      dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      const rect = win.getBoundingClientRect();
      // фиксируем текущее положение, снимаем центрирование грид-контейнера
      baseX = rect.left; baseY = rect.top;
      win.style.position = "fixed";
      win.style.margin = "0";
      win.style.left = baseX + "px";
      win.style.top = baseY + "px";
      startX = pt.clientX; startY = pt.clientY;
      document.body.style.userSelect = "none";
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      let nx = baseX + (pt.clientX - startX);
      let ny = baseY + (pt.clientY - startY);
      // держим окно в пределах экрана
      const w = win.offsetWidth, h = win.offsetHeight;
      nx = Math.max(8, Math.min(window.innerWidth - w - 8, nx));
      ny = Math.max(8, Math.min(window.innerHeight - h - 8, ny));
      win.style.left = nx + "px";
      win.style.top = ny + "px";
    };
    const onUp = () => { dragging = false; document.body.style.userSelect = ""; };

    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
  }

  function resetWindowPosition(win) {
    // вернуть в центр (через грид overlay) при повторном открытии
    win.style.position = "";
    win.style.left = "";
    win.style.top = "";
    win.style.margin = "";
  }

  /* ---------- Настройки (тема/перф/уведомления) ---------- */
  const LS_KEY = "sevi.settings.v1";

  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) Object.assign(Sevi.state.settings, JSON.parse(raw));
    } catch (_) { /* ignore */ }
  }
  function saveSettings() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(Sevi.state.settings)); } catch (_) { /* ignore */ }
  }
  function applySettings() {
    const s = Sevi.state.settings;
    document.documentElement.setAttribute("data-accent", s.accent);
    document.body.classList.toggle("perf-mode", !!s.perf);
  }

  /* ---------- Утилита склонения «день/дня/дней» ---------- */
  function pluralDays(n) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return "день";
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "дня";
    return "дней";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  Sevi.ui = {
    $, $$, toast, setIcon,
    openModal, closeModal, closeTop, wireModals,
    makeDraggable, resetWindowPosition,
    loadSettings, saveSettings, applySettings,
    pluralDays, escapeHtml,
  };
})();
