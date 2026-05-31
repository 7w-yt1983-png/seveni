/* =========================================================
   Sevi — точка входа
========================================================= */
(() => {
  "use strict";
  const { $, $$, makeDraggable, wireModals, loadSettings, applySettings, toast } = Sevi.ui;

  function wireRightPanel() {
    const btn = $("#toggleRightBtn");
    btn.addEventListener("click", () => {
      // на десктопе — прячем панель, на планшете — показываем оверлеем
      if (window.matchMedia("(max-width: 1180px)").matches) {
        document.body.classList.toggle("show-right");
      } else {
        $("#rightbar").classList.toggle("rightbar--hidden");
      }
    });
  }

  function init() {
    // Настройки до рендера (тема/перф-режим)
    loadSettings();
    applySettings();

    // Модули
    Sevi.chat.init();
    Sevi.pets.init();
    Sevi.player.init();
    Sevi.call.init();
    Sevi.profile.init();

    // Окна: закрытие + перетаскивание
    wireModals();
    $$(".window").forEach(makeDraggable);
    wireRightPanel();

    console.log("%cSevi","color:#8b5cf6;font-weight:800;font-size:16px", "интерфейс загружен ✓");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
