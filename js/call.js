/* =========================================================
   Sevi — голосовая комната и видеозвонок
========================================================= */
window.Sevi = window.Sevi || {};

(() => {
  "use strict";
  const { $, toast, setIcon, openModal, closeModal } = Sevi.ui;
  const { CHATS, PEOPLE } = Sevi.data;
  const state = Sevi.state;

  let peerName = "Bulat", peerAvatar = "BL";

  function setPeer(chat) {
    peerName = chat.name;
    peerAvatar = chat.avatar;
    $("#callPeerName").textContent = peerName;
    $("#callPeerTileName").textContent = peerName;
    $("#callPeerAvatar").textContent = peerAvatar;
    $("#screenOwner").textContent = peerName;
  }

  /* ---------- Голосовая комната (баннер) ---------- */
  function toggleVoiceRoom() {
    state.voiceRoomOpen = !state.voiceRoomOpen;
    $("#voiceRoom").hidden = !state.voiceRoomOpen;
    toast(state.voiceRoomOpen ? `🔊 Подключились к голосовой с ${peerName}` : "Вы покинули голосовую");
  }

  /* ---------- Видеозвонок ---------- */
  function openCall() {
    Sevi.ui.resetWindowPosition($("#callWindow"));
    openModal("callOverlay");
    state.call.open = true;
    state.call.timer = 0;
    $("#callTimer").textContent = "00:00";
    clearInterval(state.call.intervalId);
    state.call.intervalId = setInterval(() => {
      state.call.timer++;
      const m = String(Math.floor(state.call.timer / 60)).padStart(2, "0");
      const s = String(state.call.timer % 60).padStart(2, "0");
      $("#callTimer").textContent = `${m}:${s}`;
    }, 1000);
    toast(`📹 Видеозвонок с ${peerName}`);
  }

  function closeCall() {
    closeModal("callOverlay");
    state.call.open = false;
    clearInterval(state.call.intervalId);
    toast("Звонок завершён");
  }

  function toggleMic() {
    state.call.mic = !state.call.mic;
    const btn = $("#callMicBtn");
    setIcon(btn, state.call.mic ? "i-mic" : "i-mic-off");
    btn.classList.toggle("round-btn--off", !state.call.mic);
    btn.setAttribute("aria-pressed", String(state.call.mic));
    $("#selfMutedBadge").hidden = state.call.mic;
    // дублируем в баннер
    setIcon($("#vrMicBtn"), state.call.mic ? "i-mic" : "i-mic-off");
    $("#vrMicBtn").classList.toggle("round-btn--off", !state.call.mic);
    toast(state.call.mic ? "🎤 Микрофон включён" : "🔇 Микрофон выключен");
  }

  function toggleCam() {
    state.call.cam = !state.call.cam;
    const btn = $("#callCamBtn");
    setIcon(btn, state.call.cam ? "i-camera" : "i-camera-off");
    btn.classList.toggle("round-btn--off", !state.call.cam);
    btn.setAttribute("aria-pressed", String(state.call.cam));
    setIcon($("#vrCamBtn"), state.call.cam ? "i-camera" : "i-camera-off");
    $("#vrCamBtn").classList.toggle("round-btn--off", !state.call.cam);
    toast(state.call.cam ? "📷 Камера включена" : "📷 Камера выключена");
  }

  function toggleScreen() {
    state.call.screen = !state.call.screen;
    const btn = $("#callScreenBtn");
    btn.classList.toggle("round-btn--off", !state.call.screen);
    btn.setAttribute("aria-pressed", String(state.call.screen));
    $("#callScreen").style.display = state.call.screen ? "" : "none";
    toast(state.call.screen ? "🖥️ Демонстрация экрана включена" : "Демонстрация остановлена");
  }

  function init() {
    $("#voiceBtn").addEventListener("click", toggleVoiceRoom);
    $("#videoCallBtn").addEventListener("click", openCall);
    $("#vrExpandBtn").addEventListener("click", openCall);
    $("#vrLeaveBtn").addEventListener("click", () => { if (state.voiceRoomOpen) toggleVoiceRoom(); });
    $("#vrMicBtn").addEventListener("click", toggleMic);
    $("#vrCamBtn").addEventListener("click", toggleCam);

    $("#callEndBtn").addEventListener("click", closeCall);
    $("#callMinimize").addEventListener("click", () => { closeModal("callOverlay"); toast("Звонок свёрнут (демо)"); });
    $("#callMicBtn").addEventListener("click", toggleMic);
    $("#callCamBtn").addEventListener("click", toggleCam);
    $("#callScreenBtn").addEventListener("click", toggleScreen);
    $("#callMusicBtn").addEventListener("click", () => {
      Sevi.player.play();
      toast("🎵 Включили музыку для всех в звонке");
    });
  }

  Sevi.call = { init, setPeer, openCall, closeCall };
})();
