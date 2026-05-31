/* =========================================================
   Sevi — настройки и профили
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";
  const { $, $$, toast, openModal, closeModal, saveSettings, applySettings, pluralDays, escapeHtml } = Sevi.ui;
  const { PEOPLE, CHATS, ME } = Sevi.data;
  const state = Sevi.state;

  const PET_EMOJI = { dog: "🐶", cat: "🐱", duck: "🦆" };
  const PET_NAME = { dog: "Собачка", cat: "Кошечка", duck: "Уточка" };

  /* ---------- Настройки ---------- */
  function syncSettingsUI() {
    const s = state.settings;
    $$("#accentPicker .accent-dot").forEach((d) => d.classList.toggle("accent-dot--active", d.dataset.accent === s.accent));
    $("#perfToggle").checked = !!s.perf;
    $("#notifToggle").checked = !!s.notif;
    $("#autoreplyToggle").checked = !!s.autoreply;
  }

  function openSettings() {
    syncSettingsUI();
    Sevi.ui.resetWindowPosition($("#settingsWindow"));
    openModal("settingsOverlay");
  }

  /* ---------- Профиль ---------- */
  function renderProfile(p, isSelf) {
    const status = p.status || "online";
    const stats = isSelf
      ? [
          { val: Object.keys(CHATS).length, label: "чатов" },
          { val: PET_NAME[state.pet], label: "питомец" },
        ]
      : [
          { val: `${p.mutualStreak} ${pluralDays(p.mutualStreak)}`, label: "общий стрик" },
          { val: p.mutualGroups, label: "общих групп" },
          { val: PET_NAME[p.pet], label: "питомец" },
          { val: p.joined, label: "с нами с" },
        ];

    const actions = isSelf
      ? `<button class="primary-btn" id="editProfileBtn"><svg class="ic"><use href="#i-edit"></use></svg> Редактировать</button>`
      : `<button class="primary-btn" data-write="${p.id}"><svg class="ic"><use href="#i-message"></use></svg> Написать</button>
         <button class="ghost-btn" data-close="profileOverlay">Закрыть</button>`;

    $("#profileWindowTitle").textContent = isSelf ? "Мой профиль" : "Профиль";
    $("#profileBody").innerHTML = `
      <div class="profile-hero">
        <span class="profile-hero__avatar">${escapeHtml(p.avatar)}<span class="status-dot status-dot--${status}"></span></span>
        <span class="profile-hero__name">${escapeHtml(p.name)}</span>
        <span class="profile-hero__handle">${escapeHtml(p.handle)}</span>
        <span class="profile-hero__status">${escapeHtml(p.statusText || "в сети")}</span>
      </div>
      <p class="profile-bio">${escapeHtml(p.bio || "")}</p>
      <div class="profile-grid">
        ${stats.map((s) => `<div class="profile-stat"><div class="profile-stat__val">${escapeHtml(String(s.val))}</div><div class="profile-stat__label">${escapeHtml(s.label)}</div></div>`).join("")}
      </div>
      <div class="profile-actions">${actions}</div>`;

    if (isSelf) {
      $("#editProfileBtn").addEventListener("click", () => toast("Демо: редактирование профиля скоро 🙂"));
    } else {
      const writeBtn = $("#profileBody [data-write]");
      if (writeBtn) writeBtn.addEventListener("click", () => {
        closeModal("profileOverlay");
        // найдём dm-чат с этим человеком
        const chatId = Object.values(CHATS).find((c) => c.personId === p.id)?.id;
        if (chatId) Sevi.chat.switchChat(chatId);
      });
    }
  }

  function openMyProfile() {
    renderProfile({ ...ME, status: "online" }, true);
    Sevi.ui.resetWindowPosition($("#profileWindow"));
    openModal("profileOverlay");
  }

  function openPerson(id) {
    const p = PEOPLE[id];
    if (!p) return;
    renderProfile(p, false);
    Sevi.ui.resetWindowPosition($("#profileWindow"));
    openModal("profileOverlay");
  }

  function openPeerFromHeader() {
    const chat = CHATS[state.activeChat];
    if (chat.personId) openPerson(chat.personId);
    else toast(`${chat.name} · ${chat.status}`); // группа/канал — краткая инфа
  }

  function init() {
    // Настройки
    $("#openSettingsBtn").addEventListener("click", openSettings);
    $$("#accentPicker .accent-dot").forEach((dot) => dot.addEventListener("click", () => {
      state.settings.accent = dot.dataset.accent;
      saveSettings(); applySettings(); syncSettingsUI();
    }));
    $("#perfToggle").addEventListener("change", (e) => { state.settings.perf = e.target.checked; saveSettings(); applySettings(); toast(e.target.checked ? "⚡ Режим производительности включён" : "Глассморфизм включён"); });
    $("#notifToggle").addEventListener("change", (e) => { state.settings.notif = e.target.checked; saveSettings(); });
    $("#autoreplyToggle").addEventListener("change", (e) => { state.settings.autoreply = e.target.checked; saveSettings(); });

    // Профили
    $("#openProfileBtn").addEventListener("click", openMyProfile);
    $("#peerBtn").addEventListener("click", openPeerFromHeader);

    syncSettingsUI();
  }

  Sevi.profile = { init, openSettings, openMyProfile, openPerson };
})();
