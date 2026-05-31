/* =========================================================
   Sevi — чаты: список, переключение, фильтры, сообщения
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";
  const { $, $$, toast, escapeHtml } = Sevi.ui;
  const { CHATS, CHAT_ORDER, PEOPLE } = Sevi.data;
  const state = Sevi.state;

  const SECTION_TITLES = { dm: "Личные сообщения", groups: "Группы", channels: "Каналы" };
  const PET_EMOJI = { dog: "🐶", cat: "🐱", duck: "🦆" };

  /* ---------- Рендер списка чатов ---------- */
  function renderList() {
    const wrap = $("#chatList");
    let html = "";
    for (const section of ["dm", "groups", "channels"]) {
      html += `<p class="chat-list__label" data-section="${section}">${SECTION_TITLES[section]}</p>`;
      for (const id of CHAT_ORDER[section]) {
        const c = CHATS[id];
        const person = c.personId ? PEOPLE[c.personId] : null;
        const dot = person ? `<span class="status-dot status-dot--${person.status}"></span>` : "";
        const last = c.messages.filter((m) => m.text).slice(-1)[0];
        const preview = last
          ? (last.author ? `<b>${escapeHtml(last.author)}:</b> ${escapeHtml(last.text)}` : escapeHtml(last.text))
          : "—";
        const time = last ? (last.time || "") : "";
        const badge = c.badge ? `<span class="chat-item__badge">${c.badge}</span>` : "";
        const danger = c.streak > 0 && c.streak <= 2 ? " streak-chip--danger" : "";
        const streakChip = c.type === "channels" ? "" : `
          <span class="streak-chip${danger}" title="Стрик ${c.streak} дн.">
            <span class="streak-chip__pet">${PET_EMOJI[c.pet]}</span>
            <span class="streak-chip__count">${c.streak}</span>
          </span>`;
        html += `
          <button class="chat-item${id === state.activeChat ? " chat-item--active" : ""}" data-chat="${id}" data-folder="${c.type}">
            <span class="chat-item__avatar ${c.avatarClass || ""}">${escapeHtml(c.avatar)}${dot}</span>
            <span class="chat-item__body">
              <span class="chat-item__top">
                <span class="chat-item__name">${escapeHtml(c.name)}${c.members ? " · " + formatMembers(c.members) : ""}</span>
                <span class="chat-item__time">${escapeHtml(time)}</span>
              </span>
              <span class="chat-item__bottom">
                <span class="chat-item__preview">${preview}</span>
                ${badge}
              </span>
            </span>
            ${streakChip}
          </button>`;
      }
    }
    wrap.innerHTML = html;
  }

  function formatMembers(n) {
    return n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k" : String(n);
  }

  /* ---------- Рендер сообщений ---------- */
  function renderMessages(chat) {
    const box = $("#messages");
    let html = "";
    for (const m of chat.messages) {
      if (m.day) { html += `<div class="msg-day">${escapeHtml(m.day)}</div>`; continue; }
      if (m.streak) { html += `<div class="msg-streak"><svg class="ic"><use href="#i-flame"></use></svg><span>${escapeHtml(m.streak)}</span></div>`; continue; }
      const author = m.author ? `<span class="msg__author">${escapeHtml(m.author)}</span>` : "";
      const check = m.from === "out" ? `<svg class="ic"><use href="#i-check"></use></svg>` : "";
      html += `
        <div class="msg msg--${m.from}">
          <div class="msg__bubble">${author}${escapeHtml(m.text)}</div>
          <div class="msg__meta">${escapeHtml(m.time || "")} ${check}</div>
        </div>`;
    }
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- Переключение чата ---------- */
  function switchChat(id) {
    const chat = CHATS[id];
    if (!chat) return;
    state.activeChat = id;

    $$(".chat-item").forEach((el) => el.classList.toggle("chat-item--active", el.dataset.chat === id));

    const person = chat.personId ? PEOPLE[chat.personId] : null;
    const dot = person ? `<span class="status-dot status-dot--${person.status}"></span>` : "";
    $("#peerAvatar").innerHTML = `${escapeHtml(chat.avatar)}${dot}`;
    $("#peerName").textContent = chat.name;
    $("#peerStatus").textContent = chat.status;
    $("#composerInput").placeholder = `Сообщение${person ? " для " + person.name : ""}…`;

    // Питомец/стрик и плеер
    state.pet = chat.pet;
    state.streak = chat.streak;
    Sevi.pets.refresh();
    Sevi.player.updateSyncLabel();
    Sevi.call.setPeer(chat);

    renderMessages(chat);

    // Мобайл: открыть вид чата
    if (window.matchMedia("(max-width: 760px)").matches) document.body.classList.add("mobile-chat");
  }

  /* ---------- Фильтры + поиск ---------- */
  function applyFilters() {
    const folder = $(".folder--active").dataset.folder;
    const query = $("#searchInput").value.trim().toLowerCase();

    $$(".chat-item").forEach((el) => {
      const matchFolder = folder === "all" || el.dataset.folder === folder;
      const name = $(".chat-item__name", el).textContent.toLowerCase();
      el.style.display = matchFolder && (!query || name.includes(query)) ? "" : "none";
    });
    $$(".chat-list__label").forEach((label) => {
      const any = $$(`.chat-item[data-folder="${label.dataset.section}"]`).some((el) => el.style.display !== "none");
      label.style.display = any ? "" : "none";
    });
  }

  /* ---------- Отправка сообщений ---------- */
  function sendMessage() {
    const input = $("#composerInput");
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const chat = CHATS[state.activeChat];
    chat.messages.push({ from: "out", text, time });
    renderMessages(chat);
    input.value = "";

    if (state.settings.autoreply && chat.type !== "channels") {
      setTimeout(() => {
        const replies = ["Принял 👍", "Ахаха, согласен", "Сейчас гляну 👀", "🔥🔥🔥", "База"];
        const msg = { from: "in", text: replies[Math.floor(Math.random() * replies.length)], time };
        if (chat.type === "groups") msg.author = ["Kirill", "Nastya", "Ilya"][Math.floor(Math.random() * 3)];
        chat.messages.push(msg);
        if (state.activeChat === chat.id) renderMessages(chat);
      }, 1100);
    }
  }

  /* ---------- Инициализация ---------- */
  function init() {
    renderList();

    $("#chatList").addEventListener("click", (e) => {
      const item = e.target.closest(".chat-item");
      if (item) switchChat(item.dataset.chat);
    });

    $$(".folder").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".folder").forEach((b) => { b.classList.remove("folder--active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("folder--active");
        btn.setAttribute("aria-selected", "true");
        applyFilters();
      });
    });
    $("#searchInput").addEventListener("input", applyFilters);

    $("#sendBtn").addEventListener("click", sendMessage);
    $("#composerInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

    $("#newChatBtn").addEventListener("click", () => toast("Демо: создание чата скоро будет 🙂"));
    $("#chatBackBtn").addEventListener("click", () => document.body.classList.remove("mobile-chat"));

    switchChat(state.activeChat);
    applyFilters();
  }

  Sevi.chat = { init, switchChat, renderList, applyFilters };
})();
