/* =========================================================
   Sevi — стрики и питомцы
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";
  const { $, $$, toast, openModal, pluralDays, escapeHtml } = Sevi.ui;
  const { CHATS } = Sevi.data;
  const state = Sevi.state;

  const PET_EMOJI = { dog: "🐶", cat: "🐱", duck: "🦆" };
  const PET_NAME = { dog: "Собачка", cat: "Кошечка", duck: "Уточка" };

  function moodFor(streak) {
    if (streak <= 0) return "sleep";
    if (streak <= 2) return "sad";
    return "happy";
  }

  function moodText(pet, mood, streak) {
    const name = PET_NAME[pet];
    if (mood === "happy") return `${name} радуется ${streak}-дневному стрику!`;
    if (mood === "sad") return `${name} грустит — стрик почти сгорел, напишите другу!`;
    return `${name} уснул(а) 💤 Стрик сгорел. Начните общение заново!`;
  }

  /* ---------- Обновление UI питомца ---------- */
  function refresh() {
    const mood = moodFor(state.streak);
    const emoji = PET_EMOJI[state.pet];

    // Правая карточка
    const stage = $("#petStage");
    stage.classList.remove("pet-stage--happy", "pet-stage--sad", "pet-stage--sleep");
    stage.classList.add(`pet-stage--${mood}`);
    $("#petEmoji").textContent = emoji;
    $("#petStreakDays").textContent = state.streak;
    $("#petMood").textContent = moodText(state.pet, mood, state.streak);

    const inLevel = state.streak % 7;
    $("#petProgressBar").style.width = `${(inLevel / 7) * 100}%`;
    $("#petToNext").textContent = 7 - inLevel;

    // Бейдж в шапке
    $("#streakPet").textContent = emoji;
    $("#streakCount").textContent = state.streak;
    $("#streakBadge").classList.toggle("streak-badge--danger", state.streak > 0 && state.streak <= 2);

    // Активная кнопка выбора питомца
    $$(".pet-picker__btn").forEach((b) => b.classList.toggle("pet-picker__btn--active", b.dataset.pet === state.pet));
  }

  /* ---------- Изменение стрика ---------- */
  function changeStreak(delta) {
    const prev = moodFor(state.streak);
    state.streak = Math.max(0, state.streak + delta);
    const chat = CHATS[state.activeChat];
    chat.streak = state.streak;
    if (state.streak > chat.longest) chat.longest = state.streak;

    // Чип в списке
    const item = $(`.chat-item[data-chat="${state.activeChat}"]`);
    if (item) {
      const chip = $(".streak-chip", item);
      if (chip) {
        $(".streak-chip__count", chip).textContent = state.streak;
        chip.classList.toggle("streak-chip--danger", state.streak > 0 && state.streak <= 2);
      }
    }

    refresh();
    if ($("#streakOverlay") && !$("#streakOverlay").hidden) renderStreakBody();

    const now = moodFor(state.streak);
    if (delta > 0) {
      toast(now === "happy" && prev !== "happy"
        ? `🎉 Питомец снова счастлив! Стрик ${state.streak}`
        : `🔥 Стрик ${state.streak} ${pluralDays(state.streak)}`);
    } else {
      toast(now === "sleep" ? "💤 Стрик сгорел — питомец уснул" : `📉 Стрик упал до ${state.streak}`);
    }
  }

  function setPet(pet) {
    state.pet = pet;
    CHATS[state.activeChat].pet = pet;
    refresh();
    Sevi.chat.renderList();
    Sevi.chat.applyFilters();
    toast(`Питомец изменён на ${PET_NAME[pet]} ${PET_EMOJI[pet]}`);
  }

  /* ---------- Подробное окно стрика ---------- */
  function renderStreakBody() {
    const chat = CHATS[state.activeChat];
    const mood = moodFor(state.streak);
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const todayIdx = (new Date().getDay() + 6) % 7; // 0 = Пн
    let week = "";
    for (let i = 0; i < 7; i++) {
      // дни до сегодняшнего считаем «активными», если стрик их покрывает
      const distance = todayIdx - i;
      const done = distance >= 0 && distance < state.streak;
      week += `
        <div class="streak-day${done ? " streak-day--done" : ""}">
          <span class="streak-day__dot">${done ? '<svg class="ic"><use href="#i-flame"></use></svg>' : ""}</span>
          <span class="streak-day__label">${days[i]}</span>
        </div>`;
    }

    const note = state.streak <= 0
      ? `<div class="streak-note streak-note--danger">Стрик сгорел. Напишите ${escapeHtml(chat.name)}, чтобы начать заново!</div>`
      : state.streak <= 2
        ? `<div class="streak-note streak-note--danger">⚠️ Стрик под угрозой! Напишите сегодня, иначе питомец загрустит.</div>`
        : `<div class="streak-note">Продолжайте общаться каждый день, чтобы стрик рос 🔥</div>`;

    $("#streakBody").innerHTML = `
      <div class="streak-hero">
        <span class="streak-hero__pet">${PET_EMOJI[state.pet]}</span>
        <span class="streak-hero__count"><b>${state.streak}</b> ${pluralDays(state.streak)}</span>
        <span class="streak-hero__mood">${moodText(state.pet, mood, state.streak)}</span>
      </div>
      <div class="streak-stats">
        <div class="streak-stat"><div class="streak-stat__val">${state.streak}</div><div class="streak-stat__label">текущий</div></div>
        <div class="streak-stat"><div class="streak-stat__val">${chat.longest}</div><div class="streak-stat__label">рекорд</div></div>
        <div class="streak-stat"><div class="streak-stat__val">${PET_NAME[state.pet]}</div><div class="streak-stat__label">питомец</div></div>
      </div>
      <div class="streak-week">${week}</div>
      ${note}`;
  }

  function openStreak() {
    renderStreakBody();
    openModal("streakOverlay");
  }

  function init() {
    $("#streakPlus").addEventListener("click", () => changeStreak(1));
    $("#streakMinus").addEventListener("click", () => changeStreak(-1));
    $("#streakBadge").addEventListener("click", openStreak);
    $$(".pet-picker__btn").forEach((btn) => btn.addEventListener("click", () => setPet(btn.dataset.pet)));
    refresh();
  }

  Sevi.pets = { init, refresh, changeStreak, setPet, openStreak };
})();
