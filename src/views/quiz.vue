<!-- quiz -->
<template>
  <div class="container">
    <div class="robot_container">
      <!-- ✅ 跟 home 一樣，拿實例控制 -->
      <Robot ref="robotRef" />
    </div>
    <div class="chat_right_container">
      <chat_right
        :initialText="initialText"
        :messages="messages"
        :currentConversationId="currentConversationId"
        @updateConversationId="handleConversationIdUpdate"
        @updateMessages="addMessage"
      />
    </div>
    <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  onDeactivated,
  watch,
  nextTick,
} from "vue";
import Robot from "@/components/Robot.vue";
import chat_right from "@/components/chat_right.vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import Greet1 from "@/assets/audio/a_test_01.wav";
import Greet2 from "@/assets/audio/a_test_02.wav";
import Greet3 from "@/assets/audio/a_test_03.wav";
import { audioManager } from "@/composables/audioManager.js";

/** ✅ 跟 home.vue 一樣使用 useBotAudio */
import { useBotAudio } from "@/composables/useBotAudio";
const { currentMsgId, isPlaying, stop } = useBotAudio();

const route = useRoute();
const messages = ref([]);
const initialText = computed(() => route.query.init || "");

/** 初始導入訊息（難度按鈕） */
const quizStarter = [
  { role: "bot", text: "請問你想要什麼難度的測驗？" },
  {
    role: "bot",
    type: "buttons",
    buttons: ["easy", "medium", "hard"],
    text: "",
  },
];
const addMessage = (msg) => messages.value.push(msg);
messages.value.push(...quizStarter);

const currentConversationId = ref(null);
const handleConversationIdUpdate = (id) => {
  currentConversationId.value = id;
};

/** ✅ 機器人實例（與 home 相同） */
const robotRef = ref(null);

// ✅ 新增：控制動畫狀態（與 home 一致）
let isHiAnimating = false;
const HI_COOLDOWN = 1200;
let lastHiAt = 0;

// ✅ 新增：播放打招呼動作的函式（與 home 一致）
async function playHiAnimation() {
  const now = Date.now();
  if (now - lastHiAt < HI_COOLDOWN) return;
  lastHiAt = now;
  if (isHiAnimating) return;
  isHiAnimating = true;

  try {
    if (robotRef.value?.stopIdleLoop) robotRef.value.stopIdleLoop();

    // 播放打招呼動作
    if (robotRef.value?.SayHi) await robotRef.value.SayHi();
  } finally {
    if (robotRef.value?.startIdleLoop) robotRef.value.startIdleLoop();
    isHiAnimating = false;
  }
}

/** ✅ 完全比照 home：用 isPlaying 來聯動動畫 */
let lastToggleAt = 0;
const TOGGLE_COOLDOWN = 120; // 防止極短音檔抖動
let currentSpeakLoop = null; // ✅ 記錄當前說話循環

// ✅ 持續說話動作（直到語音停止）
async function startSpeakLoop() {
  if (currentSpeakLoop) return; // 防止重複啟動

  currentSpeakLoop = async () => {
    while (isPlaying.value) {
      if (robotRef.value?.Speak_2) {
        try {
          await robotRef.value.Speak_2(3); // 每次重複3次
        } catch {}
      }
      // 檢查是否還在播放，避免不必要的等待
      if (!isPlaying.value) break;
      await wait(100); // 短暫間隔後繼續
    }
    currentSpeakLoop = null; // 清除循環標記
  };

  currentSpeakLoop();
}

function stopSpeakLoop() {
  currentSpeakLoop = null;
}

// 等待工具
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

watch(
  isPlaying,
  async (nowPlaying) => {
    const now = Date.now();
    if (now - lastToggleAt < TOGGLE_COOLDOWN) return;
    lastToggleAt = now;

    if (nowPlaying) {
      // TTS 開始：停 idle → 開始持續說話動作
      try {
        if (robotRef.value?.stopIdleLoop) robotRef.value.stopIdleLoop();
      } catch {}

      // ✅ 啟動持續說話循環
      startSpeakLoop();
    } else {
      // TTS 結束：停止說話循環 → 回 idle
      stopSpeakLoop();

      try {
        if (robotRef.value?.startIdleLoop) robotRef.value.startIdleLoop();
      } catch {}
    }
  },
  { immediate: false }
);

/** ✅ 問候語（比照 home 的完整邏輯） */
const pageGreetingKey = "greeted:quiz";
const greetingAudios = [Greet1, Greet2, Greet3];
const toastMessage = ref("");
const toastVisible = ref(false);
function showToast(message, duration = 10000) {
  toastMessage.value = message;
  toastVisible.value = true;
  setTimeout(() => (toastVisible.value = false), duration);
}
onMounted(() => {
  // 若已問候過，直接返回
  if (sessionStorage.getItem(pageGreetingKey)) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * greetingAudios.length);
  const selectedGreeting = greetingAudios[randomIndex];

  const handler = async (event) => {
    // 點到小精靈按鈕不播放
    if (event?.target?.closest?.(".elf-button")) {
      window.removeEventListener("click", handler);
      return;
    }

    // ✅ 使用 audioManager 播放問候語（與 home 一致）
    await audioManager
      .play({
        channel: "greeting",
        src: selectedGreeting,
        duckOthers: false, // 不壓制其他音效
        fadeInMs: 120,
        onStart: () => {
          if (randomIndex === 0) showToast("我來幫你複習最近的學習內容吧!");
          if (randomIndex === 1) showToast("今天想嘗試什麼難度的題目呢?");
          if (randomIndex === 2) showToast("你準備好挑戰自己了嗎?");
        },
      })
      .catch(() => {});

    // ✅ 同時播放打招呼動作（與問候音並行）
    await playHiAnimation();

    sessionStorage.setItem(pageGreetingKey, "true"); // 只播一次
    window.removeEventListener("click", handler);
  };

  window.addEventListener("click", handler);
});

/** ✅ 清理：保持一致 */
function cleanup() {
  audioManager.stop("tts");
  audioManager.stop("greeting");
}

onBeforeRouteLeave(cleanup);
onDeactivated(cleanup);
onUnmounted(cleanup);
</script>

<style scoped>
/*關心對話筐*/
.toast {
  position: fixed;
  top: 110px;
  left: 31%;
  transform: translateX(-50%);
  background: #d1c5bd;
  backdrop-filter: blur(4px); /* 加一點霧化質感 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 更柔和陰影 */
  color: #333;
  font-size: 20px;
  font-weight: normal;
  padding: 12px 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  max-width: 80%;
  line-height: 1.4;
  opacity: 0;
  animation: fadein 0.5s forwards, fadeout 0.5s forwards 6.5s;
  pointer-events: none;
}
/*關心對話筐小尾巴*/
.toast::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 24px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-top-color: #d1c5bd; /* 半透明 */
}

.container {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}
.robot_container {
  flex: 60%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  align-items: center;
  height: 100vh;
}
.chat_right_container {
  flex: 40%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  height: 100vh;
  position: relative;
}
.robot {
  width: 100%;
  height: 100vh;
  background-color: transparent;
  z-index: -1;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
}
::v-deep(canvas) {
  transform-origin: bottom center;
  transform: scale(1.5);
}
</style>
