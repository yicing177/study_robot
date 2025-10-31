// /src/composables/useBotAudio.js
import { ref } from "vue";
import axios from "axios";
import { audioManager } from "@/composables/audioManager.js"; // 👈 引入全域音頻管理器

const currentMsgId = ref(null);
const isPlaying = ref(false);

// 方便外部需要時存取底層 <audio>
function getTtsAudioEl() {
  // audioManager 會在第一次使用時建立
  const ch = audioManager.channels.tts;
  return ch?.audio || null;
}

async function play(text, msgId) {
  // 若正在播其他訊息 → 交給 manager 仲裁（或手動停掉 tts）
  if (currentMsgId.value && currentMsgId.value !== msgId) {
    audioManager.stop("tts");
  }

  // 後端 TTS 取得音檔 URL（你原本的路由）
  let url = "";
  try {
    const res = await axios.post(
      "http://localhost:5000/routes/tts",
      { text },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    url = `http://localhost:5000/dir_tts_result/${res.data.file}`;
  } catch (err) {
    console.error("TTS 產生失敗：", err);
    return;
  }

  currentMsgId.value = msgId;

  // 交給 audioManager 播放（duck BGM、自動淡入、結束回復）
  await audioManager
    .play({
      channel: "tts",
      src: url,
      duckOthers: true, // 👈 自動壓低 BGM
      fadeInMs: 80,
      onStart: () => {
        isPlaying.value = true;
      },
      onEnd: () => {
        isPlaying.value = false;
        currentMsgId.value = null;
      },
    })
    .catch((e) => {
      // 若被瀏覽器自動播放策略阻擋，這邊不拋錯，維持安靜失敗
      console.warn("TTS 播放被阻擋：", e);
    });
}

function stop() {
  if (!isPlaying.value) return;
  audioManager.stop("tts");
  isPlaying.value = false;
  currentMsgId.value = null;
}

// 可選：若你之後想做暫停/續播按鈕
function pause() {
  audioManager.pause("tts");
  isPlaying.value = false;
}
function resume() {
  const el = getTtsAudioEl();
  if (el && el.paused && el.src) {
    el.play()
      .then(() => (isPlaying.value = true))
      .catch(() => {});
  }
}

export function useBotAudio() {
  return { play, stop, pause, resume, currentMsgId, isPlaying };
}
