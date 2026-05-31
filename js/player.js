/* =========================================================
   Sevi — музыкальный плеер (реальное аудио + плейлисты)
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";
  const { $, $$, toast, setIcon, openModal, closeModal, escapeHtml } = Sevi.ui;
  const { DEFAULT_PLAYLISTS, CHATS, PEOPLE } = Sevi.data;
  const state = Sevi.state;

  const LS_KEY = "sevi.music.v1";
  const DEFAULT_IDS = Object.keys(DEFAULT_PLAYLISTS);

  let playlists = {};   // id -> { id, name, icon, tracks: [] }
  let order = [];       // порядок отображения
  let simTimer = null;
  const audio = $("#audio");
  let songSource = "link"; // link | file
  let newPlaylistIcon = "🎵";

  /* ---------- Персистентность ---------- */
  const persistable = (t) => t.src && !t.src.startsWith("blob:");
  const deepCopy = (o) => JSON.parse(JSON.stringify(o));

  function persist() {
    try {
      const customPlaylists = order.filter((id) => !DEFAULT_IDS.includes(id))
        .map((id) => ({ id, name: playlists[id].name, icon: playlists[id].icon, tracks: playlists[id].tracks.filter(persistable) }));
      const extraTracks = {};
      for (const id of DEFAULT_IDS) {
        extraTracks[id] = playlists[id].tracks.filter((t) => t.added && persistable(t));
      }
      localStorage.setItem(LS_KEY, JSON.stringify({ customPlaylists, extraTracks }));
    } catch (_) { /* ignore */ }
  }

  function load() {
    playlists = {};
    order = [];
    for (const id of DEFAULT_IDS) { playlists[id] = deepCopy(DEFAULT_PLAYLISTS[id]); order.push(id); }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        for (const id of DEFAULT_IDS) {
          (data.extraTracks?.[id] || []).forEach((t) => { t.added = true; playlists[id].tracks.push(t); });
        }
        (data.customPlaylists || []).forEach((cp) => {
          playlists[cp.id] = { id: cp.id, name: cp.name, icon: cp.icon, tracks: (cp.tracks || []).map((t) => ({ ...t, added: true })) };
          order.push(cp.id);
        });
      }
    } catch (_) { /* ignore */ }
  }

  /* ---------- Хелперы ---------- */
  function pluralTracks(n) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return "трек";
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return "трека";
    return "треков";
  }
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  }
  const curList = () => playlists[state.player.playlistId];
  const curTrack = () => curList().tracks[state.player.trackIndex];

  /* ---------- Рендер плейлистов ---------- */
  function renderPlaylists() {
    $("#playlistList").innerHTML = order.map((id) => {
      const p = playlists[id];
      const n = p.tracks.length;
      return `
        <button class="playlist${id === state.player.playlistId ? " playlist--active" : ""}" data-playlist="${id}">
          <span class="playlist__icon">${escapeHtml(p.icon)}</span>
          <span class="playlist__meta">
            <span class="playlist__name">${escapeHtml(p.name)}</span>
            <span class="playlist__count">${n} ${pluralTracks(n)}</span>
          </span>
        </button>`;
    }).join("");
  }

  function fillPlaylistSelect() {
    $("#songPlaylist").innerHTML = order.map((id) => `<option value="${id}">${escapeHtml(playlists[id].name)}</option>`).join("");
    $("#songPlaylist").value = state.player.playlistId;
  }

  /* ---------- Загрузка/воспроизведение ---------- */
  function loadTrack(idx) {
    const list = curList();
    if (!list.tracks.length) { showEmpty(); return; }
    state.player.trackIndex = (idx + list.tracks.length) % list.tracks.length;
    const t = curTrack();
    state.player.progress = 0;
    state.player.usingAudio = !!t.src;

    $("#trackTitle").textContent = t.title;
    $("#trackArtist").textContent = t.artist;
    $("#coverArt").textContent = t.art || "🎵";

    if (t.src) {
      audio.src = t.src;
      audio.load();
      $("#durTime").textContent = t.dur ? fmt(t.dur) : "…";
    } else {
      audio.removeAttribute("src");
      $("#durTime").textContent = fmt(t.dur);
    }
    updateSeek();
  }

  function showEmpty() {
    $("#trackTitle").textContent = "Плейлист пуст";
    $("#trackArtist").textContent = "Добавьте песню";
    $("#coverArt").textContent = "🎵";
    $("#durTime").textContent = "0:00";
    state.player.progress = 0;
    updateSeek();
  }

  function updateSeek() {
    const t = curTrack();
    let pct = state.player.progress;
    if (state.player.usingAudio && audio.duration) {
      pct = (audio.currentTime / audio.duration) * 100;
      $("#curTime").textContent = fmt(audio.currentTime);
    } else if (t) {
      $("#curTime").textContent = fmt((pct / 100) * (t.dur || 0));
    }
    $("#seekFill").style.width = `${pct}%`;
    $("#seekKnob").style.left = `${pct}%`;
    $("#seek").setAttribute("aria-valuenow", Math.round(pct));
  }

  function simTick() {
    const t = curTrack();
    if (!t || !t.dur) return;
    state.player.progress += 100 / t.dur;
    if (state.player.progress >= 100) {
      if (state.player.repeat) { state.player.progress = 0; }
      else { next(true); return; }
    }
    updateSeek();
  }

  function play() {
    if (!curList().tracks.length) { toast("Плейлист пуст — добавьте песню"); return; }
    state.player.playing = true;
    $("#player").classList.add("player--playing");
    setIcon($("#playBtn"), "i-pause");
    clearInterval(simTimer);
    if (state.player.usingAudio) {
      audio.play().catch(() => toast("Не удалось воспроизвести аудио (проверьте ссылку)"));
    } else {
      simTimer = setInterval(simTick, 1000);
    }
  }

  function pause() {
    state.player.playing = false;
    $("#player").classList.remove("player--playing");
    setIcon($("#playBtn"), "i-play");
    clearInterval(simTimer);
    if (state.player.usingAudio) audio.pause();
  }

  function toggle() {
    state.player.playing ? pause() : play();
    if (state.player.playing && state.player.sync) toast(`🎵 Слушаете вместе: ${curTrack().title}`);
  }

  function next(auto = false) {
    const was = state.player.playing || auto;
    let idx = state.player.trackIndex + 1;
    if (state.player.shuffle) idx = Math.floor(Math.random() * curList().tracks.length);
    loadTrack(idx);
    if (was) play();
  }

  function prev() {
    const was = state.player.playing;
    const cur = state.player.usingAudio ? audio.currentTime : (state.player.progress / 100) * (curTrack().dur || 0);
    if (cur > 4) { restart(); return; }
    loadTrack(state.player.trackIndex - 1);
    if (was) play();
  }

  function restart() {
    state.player.progress = 0;
    if (state.player.usingAudio) audio.currentTime = 0;
    updateSeek();
  }

  function selectPlaylist(id) {
    if (!playlists[id]) return;
    state.player.playlistId = id;
    renderPlaylists();
    loadTrack(0);
    play();
    toast(`▶ Плейлист «${playlists[id].name}»`);
  }

  /* ---------- Создание плейлиста ---------- */
  function openNewPlaylist() {
    $("#playlistName").value = "";
    newPlaylistIcon = "🎵";
    $$("#playlistIconPicker .emoji-picker__btn").forEach((b) => b.classList.toggle("emoji-picker__btn--active", b.dataset.icon === "🎵"));
    Sevi.ui.resetWindowPosition($("#playlistWindow"));
    openModal("playlistOverlay");
    setTimeout(() => $("#playlistName").focus(), 50);
  }

  function saveNewPlaylist() {
    const name = $("#playlistName").value.trim();
    if (!name) { toast("Введите название плейлиста"); return; }
    const id = "pl_" + Date.now();
    playlists[id] = { id, name, icon: newPlaylistIcon, tracks: [] };
    order.push(id);
    persist();
    renderPlaylists();
    closeModal("playlistOverlay");
    toast(`Плейлист «${name}» создан ✓`);
  }

  /* ---------- Добавление песни ---------- */
  function openAddSong() {
    $("#songTitle").value = "";
    $("#songArtist").value = "";
    $("#songLink").value = "";
    $("#songFile").value = "";
    fillPlaylistSelect();
    setSource("link");
    Sevi.ui.resetWindowPosition($("#songWindow"));
    openModal("songOverlay");
    setTimeout(() => $("#songTitle").focus(), 50);
  }

  function setSource(src) {
    songSource = src;
    $$("#songOverlay .seg__btn").forEach((b) => b.classList.toggle("seg__btn--active", b.dataset.src === src));
    $("#songLinkField").hidden = src !== "link";
    $("#songFileField").hidden = src !== "file";
  }

  function saveSong() {
    const title = $("#songTitle").value.trim();
    const artist = $("#songArtist").value.trim() || "Неизвестный исполнитель";
    const pid = $("#songPlaylist").value;
    if (!title) { toast("Введите название песни"); return; }

    let src = "";
    if (songSource === "link") {
      src = $("#songLink").value.trim();
      if (!src) { toast("Вставьте ссылку на аудио"); return; }
    } else {
      const file = $("#songFile").files[0];
      if (!file) { toast("Выберите аудиофайл"); return; }
      src = URL.createObjectURL(file);
    }

    const track = { title, artist, art: "🎶", dur: 0, src, added: true };
    playlists[pid].tracks.push(track);
    persist();
    renderPlaylists();
    closeModal("songOverlay");
    toast(`«${title}» добавлена в «${playlists[pid].name}» 🎵`);

    // если плейлист открыт и был пуст — подгрузим трек
    if (pid === state.player.playlistId && playlists[pid].tracks.length === 1) loadTrack(0);
  }

  /* ---------- Метка совместного прослушивания ---------- */
  function updateSyncLabel() {
    const chat = CHATS[state.activeChat];
    const peer = chat.personId ? PEOPLE[chat.personId].name : chat.name;
    $("#playerSyncLabel").textContent = state.player.sync ? `вместе с ${peer}` : "соло-режим";
  }

  /* ---------- Аудио-события ---------- */
  function wireAudio() {
    audio.addEventListener("timeupdate", () => { if (state.player.usingAudio) updateSeek(); });
    audio.addEventListener("loadedmetadata", () => {
      if (state.player.usingAudio) { $("#durTime").textContent = fmt(audio.duration); updateSeek(); }
    });
    audio.addEventListener("ended", () => {
      if (state.player.repeat) { audio.currentTime = 0; audio.play(); }
      else next(true);
    });
    audio.addEventListener("error", () => {
      if (audio.getAttribute("src")) toast("Ошибка загрузки аудио — проверьте ссылку");
    });
  }

  /* ---------- Инициализация ---------- */
  function init() {
    load();
    renderPlaylists();
    loadTrack(0);
    wireAudio();

    $("#playBtn").addEventListener("click", toggle);
    $("#nextBtn").addEventListener("click", () => next());
    $("#prevBtn").addEventListener("click", prev);
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

    $("#seek").addEventListener("click", (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      state.player.progress = pct;
      if (state.player.usingAudio && audio.duration) audio.currentTime = (pct / 100) * audio.duration;
      updateSeek();
    });

    $("#playlistList").addEventListener("click", (e) => {
      const pl = e.target.closest(".playlist");
      if (pl) selectPlaylist(pl.dataset.playlist);
    });

    $("#playerSync").addEventListener("click", () => {
      state.player.sync = !state.player.sync;
      $("#playerSync").classList.toggle("player__sync--off", !state.player.sync);
      updateSyncLabel();
      toast(state.player.sync ? "🎧 Совместное прослушивание включено" : "Соло-режим");
    });

    $("#newPlaylistBtn").addEventListener("click", openNewPlaylist);
    $("#playlistSaveBtn").addEventListener("click", saveNewPlaylist);
    $$("#playlistIconPicker .emoji-picker__btn").forEach((b) => b.addEventListener("click", () => {
      newPlaylistIcon = b.dataset.icon;
      $$("#playlistIconPicker .emoji-picker__btn").forEach((x) => x.classList.remove("emoji-picker__btn--active"));
      b.classList.add("emoji-picker__btn--active");
    }));
    $("#playlistName").addEventListener("keydown", (e) => { if (e.key === "Enter") saveNewPlaylist(); });

    $("#addSongBtn").addEventListener("click", openAddSong);
    $("#songSaveBtn").addEventListener("click", saveSong);
    $$("#songOverlay .seg__btn").forEach((b) => b.addEventListener("click", () => setSource(b.dataset.src)));

    updateSyncLabel();
  }

  Sevi.player = { init, updateSyncLabel, play, pause };
})();
