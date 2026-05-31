/* =========================================================
   Sevi — логика интерфейса
   Чаты · стрики с питомцами · музыкальный плеер · видеозвонок
========================================================= */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Тост-уведомления ---------- */
  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("toast--show"), 2400);
  }

  /* =========================================================
     ДАННЫЕ ЧАТОВ
  ========================================================= */
  const PET_EMOJI = {
    dog:  { happy: "🐶", sad: "🐶", sleep: "🐶" },
    cat:  { happy: "🐱", sad: "🐱", sleep: "🐱" },
    duck: { happy: "🦆", sad: "🦆", sleep: "🦆" },
  };
  const PET_NAME = { dog: "Собачка", cat: "Кошечка", duck: "Уточка" };

  const CHATS = {
    bulat: {
      name: "Bulat", avatar: "BL", status: "в сети · печатает…", pet: "dog", streak: 14,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "Йо! Ты слышал новый альбом Neon Cassette?", time: "16:40" },
        { from: "out", text: "Ещё нет, скинь 👀", time: "16:41" },
        { from: "in", text: "Скинул трек, врубай в голосовой 🎶", time: "16:48" },
        { streak: "Стрик 14 дней! Питомец 🐶 счастлив 🎉" },
      ],
    },
    alina: {
      name: "Alina", avatar: "AL", status: "не беспокоить", pet: "cat", streak: 6,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "Привет! Завтра в кафе в 5?", time: "15:10" },
        { from: "out", text: "Да, договорились ✨", time: "15:20" },
        { streak: "Стрик 6 дней! Кошечка 🐱 довольна" },
      ],
    },
    timur: {
      name: "Timur", avatar: "TM", status: "был(а) недавно", pet: "duck", streak: 1,
      messages: [
        { day: "Вчера" },
        { from: "in", text: "Стрик под угрозой, напиши 👀", time: "21:30" },
        { streak: "⚠️ Уточка 🦆 грустит — стрик почти сгорел!" },
      ],
    },
    sevenis: {
      name: "Sevenis · 248", avatar: "SV", status: "248 участников · 32 в сети", pet: "dog", streak: 30,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "Kirill: релиз сегодня 🚀", time: "16:50" },
        { from: "in", text: "Nastya: я готовлю чейнджлог", time: "16:51" },
        { from: "out", text: "Огонь, я проверю прод 💪", time: "16:52" },
        { streak: "Групповой стрик 30 дней! 🐶🔥" },
      ],
    },
    design: {
      name: "Design Lab · 56", avatar: "DL", status: "56 участников", pet: "cat", streak: 9,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "Nastya: накинула макеты в Figma", time: "14:02" },
        { from: "out", text: "Смотрю, выглядит чисто 🔥", time: "14:10" },
      ],
    },
    news: {
      name: "Sevi News", avatar: "#", status: "канал · 12.4k подписчиков", pet: "duck", streak: 0,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "📢 Обновление 2.4: питомцы-стрики и встроенный плеер!", time: "12:30" },
        { from: "in", text: "Совместное прослушивание уже доступно в голосовых 🎵", time: "12:31" },
      ],
    },
    lofi: {
      name: "Lo-Fi Radio", avatar: "🎵", status: "🔴 в эфире · 1.2k слушают", pet: "dog", streak: 0,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "🔴 Сейчас играет: Rainy Tokyo — chillhop", time: "сейчас" },
      ],
    },
  };

  /* =========================================================
     СОСТОЯНИЕ
  ========================================================= */
  const state = {
    activeChat: "bulat",
    pet: "dog",
    streak: 14,
    player: { playing: false, shuffle: false, repeat: false, trackIndex: 0, progress: 38, sync: true },
    call: { open: false, mic: true, cam: true, screen: true, timer: 0, intervalId: null },
    voiceRoomOpen: false,
  };

  /* =========================================================
     РЕНДЕР ЧАТА
  ========================================================= */
  const messagesEl = $("#messages");

  function renderMessages(chat) {
    messagesEl.innerHTML = "";
    chat.messages.forEach((m) => {
      if (m.day) {
        const d = document.createElement("div");
        d.className = "msg-day";
        d.textContent = m.day;
        messagesEl.appendChild(d);
        return;
      }
      if (m.streak) {
        const s = document.createElement("div");
        s.className = "msg-streak";
        s.innerHTML = `<span>🔥</span><span>${m.streak}</span>`;
        messagesEl.appendChild(s);
        return;
      }
      const wrap = document.createElement("div");
      wrap.className = `msg msg--${m.from}`;
      wrap.innerHTML = `
        <div class="msg__bubble">${m.text}</div>
        <div class="msg__meta">${m.time}${m.from === "out" ? " · ✓✓" : ""}</div>`;
      messagesEl.appendChild(wrap);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function switchChat(key) {
    const chat = CHATS[key];
    if (!chat) return;
    state.activeChat = key;

    $$(".chat-item").forEach((el) =>
      el.classList.toggle("chat-item--active", el.dataset.chat === key)
    );

    $("#peerName").textContent = chat.name;
    $("#peerStatus").textContent = chat.status;
    $("#peerAvatar").childNodes[0].nodeValue = chat.avatar;
    $("#composerInput").placeholder = `Сообщение для ${chat.name.split(" ")[0]}…`;
    $("#callPeerName").textContent = chat.name.split(" ")[0];
    $("#playerSync").lastChild.nodeValue = ` вместе с ${chat.name.split(" ")[0]}`;

    // Питомец и стрик переключаемого чата
    state.pet = chat.pet;
    state.streak = chat.streak;
    syncPetPicker();
    updatePet();

    renderMessages(chat);
  }

  // Делегирование кликов по списку чатов
  $("#chatList").addEventListener("click", (e) => {
    const item = e.target.closest(".chat-item");
    if (item) switchChat(item.dataset.chat);
  });

  /* =========================================================
     ПАПКИ + ПОИСК
  ========================================================= */
  function applyFilters() {
    const folder = $(".folder--active").dataset.folder;
    const query = $("#searchInput").value.trim().toLowerCase();

    $$(".chat-item").forEach((el) => {
      const matchFolder = folder === "all" || el.dataset.folder === folder;
      const name = $(".chat-item__name", el).textContent.toLowerCase();
      const matchQuery = !query || name.includes(query);
      el.style.display = matchFolder && matchQuery ? "" : "none";
    });

    // Скрываем заголовки секций без видимых чатов
    $$(".chat-list__label").forEach((label) => {
      const section = label.dataset.section;
      const anyVisible = $$(`.chat-item[data-folder="${section}"]`)
        .some((el) => el.style.display !== "none");
      label.style.display = anyVisible ? "" : "none";
    });
  }

  $$(".folder").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".folder").forEach((b) => {
        b.classList.remove("folder--active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("folder--active");
      btn.setAttribute("aria-selected", "true");
      applyFilters();
    });
  });

  $("#searchInput").addEventListener("input", applyFilters);

  /* =========================================================
     ОТПРАВКА СООБЩЕНИЙ
  ========================================================= */
  function sendMessage() {
    const input = $("#composerInput");
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    CHATS[state.activeChat].messages.push({ from: "out", text, time });
    renderMessages(CHATS[state.activeChat]);
    input.value = "";

    // Авто-ответ собеседника
    setTimeout(() => {
      CHATS[state.activeChat].messages.push({
        from: "in",
        text: ["Принял 👍", "Ахаха, согласен", "Сейчас гляну 👀", "🔥🔥🔥"][Math.floor(Math.random() * 4)],
        time,
      });
      renderMessages(CHATS[state.activeChat]);
    }, 1200);
  }

  $("#sendBtn").addEventListener("click", sendMessage);
  $("#composerInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  /* =========================================================
     СИСТЕМА СТРИКОВ + ПИТОМЦЫ
  ========================================================= */
  function petMoodFor(streak) {
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

  function updatePet() {
    const mood = petMoodFor(state.streak);
    const emoji = PET_EMOJI[state.pet][mood];

    // Правый сайдбар
    const stage = $("#petStage");
    stage.classList.remove("pet-stage--happy", "pet-stage--sad", "pet-stage--sleep");
    stage.classList.add(`pet-stage--${mood}`);
    $("#petEmoji").textContent = emoji;
    $("#petStreakDays").textContent = state.streak;
    $("#petMood").textContent = moodText(state.pet, mood, state.streak);

    const pct = Math.min(100, (state.streak % 7) / 7 * 100) || (state.streak > 0 ? 100 : 0);
    $("#petProgressBar").style.width = `${pct}%`;
    $("#petToNext").textContent = state.streak > 0 ? (7 - (state.streak % 7 || 7)) || 0 : 7;

    // Виджет в шапке чата
    $("#streakPet").textContent = emoji;
    $("#streakCount").textContent = state.streak;
    const moodShort = mood === "happy" ? "Питомец счастлив!"
      : mood === "sad" ? "Стрик под угрозой!" : "Питомец уснул 💤";
    $("#streakMood").textContent = moodShort;

    // Анимация прыжка при изменении
    const widgetPet = $("#streakPet");
    widgetPet.style.animation = "none";
    void widgetPet.offsetWidth;
    widgetPet.style.animation = "";
  }

  function changeStreak(delta) {
    const prevMood = petMoodFor(state.streak);
    state.streak = Math.max(0, state.streak + delta);
    CHATS[state.activeChat].streak = state.streak;

    // Обновляем чип в списке чатов
    const activeItem = $(`.chat-item[data-chat="${state.activeChat}"]`);
    if (activeItem) {
      const chip = $(".streak-chip", activeItem);
      if (chip) {
        $(".streak-chip__count", chip).textContent = state.streak;
        chip.classList.toggle("streak-chip--danger", state.streak > 0 && state.streak <= 2);
      }
    }

    updatePet();

    const newMood = petMoodFor(state.streak);
    if (delta > 0) {
      toast(newMood === "happy" && prevMood !== "happy"
        ? `🎉 Питомец снова счастлив! Стрик ${state.streak}`
        : `🔥 Стрик ${state.streak} ${plural(state.streak)}`);
    } else {
      toast(newMood === "sleep"
        ? "💤 Стрик сгорел — питомец уснул"
        : `📉 Стрик упал до ${state.streak}`);
    }
  }

  function plural(n) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return "день";
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "дня";
    return "дней";
  }

  $("#streakPlus").addEventListener("click", () => changeStreak(1));
  $("#streakMinus").addEventListener("click", () => changeStreak(-1));
  $("#streakWidget").addEventListener("click", () =>
    toast(`🔥 Стрик с ${CHATS[state.activeChat].name.split(" ")[0]}: ${state.streak} ${plural(state.streak)}`)
  );

  // Выбор питомца
  function syncPetPicker() {
    $$(".pet-picker__btn").forEach((b) =>
      b.classList.toggle("pet-picker__btn--active", b.dataset.pet === state.pet)
    );
  }
  $$(".pet-picker__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.pet = btn.dataset.pet;
      CHATS[state.activeChat].pet = state.pet;
      syncPetPicker();
      updatePet();
      toast(`Питомец изменён на ${PET_NAME[state.pet]} ${PET_EMOJI[state.pet].happy}`);
    });
  });

  /* =========================================================
     МУЗЫКАЛЬНЫЙ ПЛЕЕР
  ========================================================= */
  const PLAYLISTS = {
    cafe: [
      { title: "Midnight Drive", artist: "Neon Cassette", dur: 188, art: "🎵" },
      { title: "Latte Mornings", artist: "Soft Static", dur: 154, art: "☕" },
      { title: "Velvet Window", artist: "Mono Lake", dur: 201, art: "🌫️" },
    ],
    bar: [
      { title: "Neon Alley", artist: "After Hours", dur: 176, art: "🍸" },
      { title: "Smoke & Bass", artist: "Lowlight", dur: 222, art: "🎷" },
    ],
    focus: [
      { title: "Deep Current", artist: "Tidal Mind", dur: 240, art: "🎧" },
      { title: "Paper Planes", artist: "Slow Loop", dur: 198, art: "📄" },
    ],
  };

  let currentPlaylist = "cafe";
  let seekTimer = null;

  const playerEl = $("#player");

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function loadTrack(idx) {
    const list = PLAYLISTS[currentPlaylist];
    state.player.trackIndex = (idx + list.length) % list.length;
    const t = list[state.player.trackIndex];
    state.player.progress = 0;
    $("#trackTitle").textContent = t.title;
    $("#trackArtist").textContent = t.artist;
    $("#coverArt").textContent = t.art;
    $("#durTime").textContent = fmt(t.dur);
    updateSeek();
  }

  function currentTrack() {
    return PLAYLISTS[currentPlaylist][state.player.trackIndex];
  }

  function updateSeek() {
    const t = currentTrack();
    const pct = state.player.progress;
    $("#seekFill").style.width = `${pct}%`;
    $("#seekKnob").style.left = `${pct}%`;
    $("#curTime").textContent = fmt((pct / 100) * t.dur);
  }

  function tick() {
    state.player.progress += 100 / currentTrack().dur; // +1 секунда
    if (state.player.progress >= 100) {
      if (state.player.repeat) {
        state.player.progress = 0;
      } else {
        nextTrack(true);
        return;
      }
    }
    updateSeek();
  }

  function play() {
    state.player.playing = true;
    playerEl.classList.add("player--playing");
    $("#playBtn").textContent = "⏸";
    clearInterval(seekTimer);
    seekTimer = setInterval(tick, 1000);
  }

  function pause() {
    state.player.playing = false;
    playerEl.classList.remove("player--playing");
    $("#playBtn").textContent = "▶";
    clearInterval(seekTimer);
  }

  function togglePlay() {
    state.player.playing ? pause() : play();
    if (state.player.playing && state.player.sync)
      toast(`🎵 Слушаете вместе: ${currentTrack().title}`);
  }

  function nextTrack(auto = false) {
    const wasPlaying = state.player.playing;
    let idx = state.player.trackIndex + 1;
    if (state.player.shuffle) {
      idx = Math.floor(Math.random() * PLAYLISTS[currentPlaylist].length);
    }
    loadTrack(idx);
    if (wasPlaying || auto) play();
  }

  function prevTrack() {
    const wasPlaying = state.player.playing;
    if (state.player.progress > 8) {
      state.player.progress = 0;
      updateSeek();
      return;
    }
    loadTrack(state.player.trackIndex - 1);
    if (wasPlaying) play();
  }

  $("#playBtn").addEventListener("click", togglePlay);
  $("#nextBtn").addEventListener("click", () => nextTrack());
  $("#prevBtn").addEventListener("click", prevTrack);

  $("#shuffleBtn").addEventListener("click", (e) => {
    state.player.shuffle = !state.player.shuffle;
    e.currentTarget.classList.toggle("player__btn--active", state.player.shuffle);
    toast(state.player.shuffle ? "🔀 Перемешивание включено" : "Перемешивание выключено");
  });
  $("#repeatBtn").addEventListener("click", (e) => {
    state.player.repeat = !state.player.repeat;
    e.currentTarget.classList.toggle("player__btn--active", state.player.repeat);
    toast(state.player.repeat ? "🔁 Повтор трека" : "Повтор выключен");
  });

  // Перемотка по таймлайну
  $("#seek").addEventListener("click", (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    state.player.progress = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    updateSeek();
  });

  // Плейлисты
  $$(".playlist").forEach((pl) => {
    pl.addEventListener("click", () => {
      $$(".playlist").forEach((p) => p.classList.remove("playlist--active"));
      pl.classList.add("playlist--active");
      currentPlaylist = pl.dataset.playlist;
      loadTrack(0);
      play();
      toast(`▶ Плейлист «${$(".playlist__name", pl).textContent}»`);
    });
  });

  $("#playerSync").addEventListener("click", () => {
    state.player.sync = !state.player.sync;
    $("#playerSync").classList.toggle("player__sync--off", !state.player.sync);
    toast(state.player.sync ? "🎧 Совместное прослушивание включено" : "Совместное прослушивание выключено");
  });

  /* =========================================================
     ГОЛОСОВАЯ КОМНАТА
  ========================================================= */
  function toggleVoiceRoom(open) {
    state.voiceRoomOpen = open !== undefined ? open : !state.voiceRoomOpen;
    $("#voiceRoom").hidden = !state.voiceRoomOpen;
    toast(state.voiceRoomOpen ? "🔊 Вы в голосовой комнате" : "Вы вышли из комнаты");
  }

  $("#voiceBtn").addEventListener("click", () => toggleVoiceRoom());
  $("#vrLeaveBtn").addEventListener("click", () => toggleVoiceRoom(false));
  $("#vrMicBtn").addEventListener("click", (e) => toggleRound(e.currentTarget, "Микрофон"));
  $("#vrCamBtn").addEventListener("click", (e) => {
    const on = toggleRound(e.currentTarget, "Камера");
    if (on) openCall();
  });
  $("#vrExpandBtn").addEventListener("click", openCall);

  function toggleRound(btn, label) {
    const pressed = btn.getAttribute("aria-pressed") === "true";
    const next = !pressed;
    btn.setAttribute("aria-pressed", String(next));
    btn.classList.toggle("round-btn--off", !next);
    toast(`${label}: ${next ? "вкл" : "выкл"}`);
    return next;
  }

  /* =========================================================
     ВИДЕОЗВОНОК (модалка)
  ========================================================= */
  const overlay = $("#callOverlay");

  function openCall() {
    if (state.call.open) return;
    state.call.open = true;
    overlay.hidden = false;
    state.call.timer = 0;
    $("#callTimer").textContent = "00:00";
    state.call.intervalId = setInterval(() => {
      state.call.timer++;
      const m = String(Math.floor(state.call.timer / 60)).padStart(2, "0");
      const s = String(state.call.timer % 60).padStart(2, "0");
      $("#callTimer").textContent = `${m}:${s}`;
    }, 1000);
    toast("🎥 Видеозвонок начат");
  }

  function closeCall() {
    if (!state.call.open) return;
    state.call.open = false;
    overlay.hidden = true;
    clearInterval(state.call.intervalId);
    toast("Звонок завершён");
  }

  $("#videoCallBtn").addEventListener("click", openCall);
  $("#callEndBtn").addEventListener("click", closeCall);
  $("#callMinimize").addEventListener("click", closeCall);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeCall(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.call.open) closeCall(); });

  // Кнопки управления звонком
  $("#callMicBtn").addEventListener("click", (e) => {
    state.call.mic = toggleRound(e.currentTarget, "Микрофон");
    $("#selfMutedBadge").hidden = state.call.mic;
  });
  $("#callCamBtn").addEventListener("click", (e) => {
    state.call.cam = toggleRound(e.currentTarget, "Камера");
  });
  $("#callScreenBtn").addEventListener("click", (e) => {
    const pressed = e.currentTarget.getAttribute("aria-pressed") === "true";
    state.call.screen = !pressed;
    e.currentTarget.setAttribute("aria-pressed", String(state.call.screen));
    e.currentTarget.classList.toggle("round-btn--off", !state.call.screen);
    $("#callScreen").style.visibility = state.call.screen ? "visible" : "hidden";
    toast(state.call.screen ? "🖥️ Демонстрация экрана включена" : "Демонстрация остановлена");
  });
  $("#callMusicBtn").addEventListener("click", () => {
    if (!state.player.playing) play();
    toast(`🎵 Слушаете вместе в звонке: ${currentTrack().title}`);
  });

  /* =========================================================
     ПРАВАЯ ПАНЕЛЬ (показать/скрыть)
  ========================================================= */
  $("#toggleRightBtn").addEventListener("click", () => {
    $("#rightbar").classList.toggle("rightbar--hidden");
  });

  /* =========================================================
     ИНИЦИАЛИЗАЦИЯ
  ========================================================= */
  function init() {
    switchChat("bulat");
    loadTrack(0);
    applyFilters();
    console.log("%cSevi", "color:#2bff88;font-weight:800;font-size:18px", "интерфейс загружен ✓");
  }

  init();
})();
