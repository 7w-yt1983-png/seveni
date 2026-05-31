/* =========================================================
   Sevi — данные и состояние приложения
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";

  /* ---------- Профили людей ---------- */
  const PEOPLE = {
    bulat: {
      id: "bulat", name: "Bulat", avatar: "BL", handle: "@bulat", status: "online",
      statusText: "в сети", bio: "Меломан и фанат лоу-фая. Всегда на связи в голосовых 🎧",
      mutualStreak: 14, mutualGroups: 3, pet: "dog", joined: "2024",
    },
    alina: {
      id: "alina", name: "Alina", avatar: "AL", handle: "@alina", status: "idle",
      statusText: "не беспокоить", bio: "Дизайнер интерфейсов. Рисую в Figma по ночам ✨",
      mutualStreak: 6, mutualGroups: 2, pet: "cat", joined: "2023",
    },
    timur: {
      id: "timur", name: "Timur", avatar: "TM", handle: "@timur", status: "offline",
      statusText: "был(а) недавно", bio: "Геймер. Стримлю по выходным 🎮",
      mutualStreak: 1, mutualGroups: 1, pet: "duck", joined: "2025",
    },
  };

  /* ---------- Чаты ---------- */
  const CHATS = {
    bulat: {
      id: "bulat", type: "dm", personId: "bulat", name: "Bulat", avatar: "BL",
      status: "в сети", pet: "dog", streak: 14, longest: 21, badge: 2,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "Йо! Ты слышал новый альбом Neon Cassette?", time: "16:40" },
        { from: "out", text: "Ещё нет, скинь 👀", time: "16:41" },
        { from: "in", text: "Скинул трек, врубай в голосовой 🎶", time: "16:48" },
        { streak: "Стрик 14 дней! Питомец 🐶 счастлив 🎉" },
      ],
    },
    alina: {
      id: "alina", type: "dm", personId: "alina", name: "Alina", avatar: "AL", avatarClass: "chat-item__avatar--green",
      status: "не беспокоить", pet: "cat", streak: 6, longest: 12, badge: 0,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "Привет! Завтра в кафе в 5?", time: "15:10" },
        { from: "out", text: "Да, договорились ✨", time: "15:20" },
        { streak: "Стрик 6 дней! Кошечка 🐱 довольна" },
      ],
    },
    timur: {
      id: "timur", type: "dm", personId: "timur", name: "Timur", avatar: "TM",
      status: "был(а) недавно", pet: "duck", streak: 1, longest: 9, badge: 0,
      messages: [
        { day: "Вчера" },
        { from: "in", text: "Стрик под угрозой, напиши 👀", time: "21:30" },
        { streak: "⚠️ Уточка 🦆 грустит — стрик почти сгорел!" },
      ],
    },
    sevenis: {
      id: "sevenis", type: "groups", name: "Sevenis", avatar: "SV", avatarClass: "chat-item__avatar--group",
      members: 248, status: "248 участников · 32 в сети", pet: "dog", streak: 30, longest: 30, badge: 12,
      messages: [
        { day: "Сегодня" },
        { from: "in", author: "Kirill", text: "релиз сегодня 🚀", time: "16:50" },
        { from: "in", author: "Nastya", text: "я готовлю чейнджлог", time: "16:51" },
        { from: "out", text: "Огонь, я проверю прод 💪", time: "16:52" },
        { streak: "Групповой стрик 30 дней! 🐶🔥" },
      ],
    },
    design: {
      id: "design", type: "groups", name: "Design Lab", avatar: "DL", avatarClass: "chat-item__avatar--group chat-item__avatar--green",
      members: 56, status: "56 участников", pet: "cat", streak: 9, longest: 15, badge: 0,
      messages: [
        { day: "Сегодня" },
        { from: "in", author: "Nastya", text: "накинула макеты в Figma", time: "14:02" },
        { from: "out", text: "Смотрю, выглядит чисто 🔥", time: "14:10" },
      ],
    },
    news: {
      id: "news", type: "channels", name: "Sevi News", avatar: "#", avatarClass: "chat-item__avatar--channel",
      members: 12400, status: "канал · 12.4k подписчиков", pet: "duck", streak: 0, longest: 0, badge: 0,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "📢 Обновление 2.4: питомцы-стрики и встроенный плеер!", time: "12:30" },
        { from: "in", text: "Совместное прослушивание уже доступно в голосовых 🎵", time: "12:31" },
      ],
    },
    lofi: {
      id: "lofi", type: "channels", name: "Lo-Fi Radio", avatar: "🎵", avatarClass: "chat-item__avatar--channel chat-item__avatar--green",
      members: 1200, status: "🔴 в эфире · 1.2k слушают", pet: "dog", streak: 0, longest: 0, badge: 0,
      messages: [
        { day: "Сегодня" },
        { from: "in", text: "🔴 Сейчас играет: Rainy Tokyo — chillhop", time: "сейчас" },
      ],
    },
  };

  const CHAT_ORDER = {
    dm: ["bulat", "alina", "timur"],
    groups: ["sevenis", "design"],
    channels: ["news", "lofi"],
  };

  /* ---------- Базовые плейлисты ---------- */
  const DEFAULT_PLAYLISTS = {
    cafe: { id: "cafe", name: "Cafe", icon: "☕", tracks: [
      { title: "Midnight Drive", artist: "Neon Cassette", dur: 188, art: "🎵" },
      { title: "Latte Mornings", artist: "Soft Static", dur: 154, art: "☕" },
      { title: "Velvet Window", artist: "Mono Lake", dur: 201, art: "🌫️" },
    ]},
    bar: { id: "bar", name: "Bar", icon: "🍸", tracks: [
      { title: "Neon Alley", artist: "After Hours", dur: 176, art: "🍸" },
      { title: "Smoke & Bass", artist: "Lowlight", dur: 222, art: "🎷" },
    ]},
    focus: { id: "focus", name: "Focus Flow", icon: "🎧", tracks: [
      { title: "Deep Current", artist: "Tidal Mind", dur: 240, art: "🎧" },
      { title: "Paper Planes", artist: "Slow Loop", dur: 198, art: "📄" },
    ]},
  };

  /* ---------- Профиль текущего пользователя ---------- */
  const ME = { name: "Mark", avatar: "MK", handle: "@mark", statusText: "в сети", bio: "Создаю Sevi 💜💚" };

  /* ---------- Состояние ---------- */
  const state = {
    activeChat: "bulat",
    pet: "dog",
    streak: 14,
    settings: { accent: "violet", perf: false, notif: true, autoreply: true },
    player: { playing: false, shuffle: false, repeat: false, playlistId: "cafe", trackIndex: 0, progress: 0, sync: true, usingAudio: false },
    call: { open: false, mic: true, cam: true, screen: true, timer: 0, intervalId: null },
    voiceRoomOpen: false,
  };

  Sevi.data = { PEOPLE, CHATS, CHAT_ORDER, DEFAULT_PLAYLISTS, ME };
  Sevi.state = state;
})();
