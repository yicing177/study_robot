<template>
  <div class="container">
    <div :style="backgroundStyle" class="room_image"></div>
    <Robot ref="robotRef" />
    <Function @openConversation="handleOpenConversation" />
    <div class="chatting">
      <div class="default" v-if="!isChatOpen">
        <button class="d1" @click="setInputText('明天要考試了好焦慮...')">
          明天要考試了好焦慮...
        </button>
        <button class="d2" @click="setInputText('可以陪我聊聊嗎？')">
          可以陪我聊聊嗎？
        </button>
        <button class="d3" @click="setInputText('今天要複習什麼呢？')">
          今天要複習什麼呢？
        </button>
        <button class="d4" @click="setInputText('推薦今天適合的讀書音樂！')">
          推薦今天適合的讀書音樂！
        </button>
      </div>

      <div v-if="isChatOpen" class="home_chatting_container">
        <div class="header">
          <div class="title" v-if="currentTitle">
            {{ currentTitle }}
          </div>
          <div class="tool_btn">
            <button class="summary_btn" @click="summarizeConversation">
              總結對話
            </button>
            <button class="reset_btn" @click="confirmReset">開新對話</button>
          </div>
        </div>
        <div class="dialog_wrapper" ref="dialogWrapper">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="['bubble', msg.role]"
          >
            <div class="leftArea">
              <img
                :src="msg.role === 'bot' ? botAvatar : userAvatar"
                class="avatar"
              />
              <!-- 只有正在播放的 bot 訊息，才顯示停止鈕 -->
              <div
                v-if="
                  msg.role === 'bot' && msg.id === currentMsgId && isPlaying
                "
                class="tts-controls"
              >
                <button class="stop_btn" @click="stop">⏹ 停止語音</button>
              </div>
            </div>
            <div
              class="text"
              v-if="msg.role === 'bot'"
              v-html="renderMarkdown(msg.text)"
            ></div>
            <div class="text" v-else>{{ msg.text }}</div>
          </div>
        </div>
      </div>
      <chat_bottom
        :initialText="inputText"
        :messages="messages"
        :handleSelfMessage="true"
        :currentConversationId="currentConversationId"
        @updateConversationId="handleNewConversationId"
        @updateMessages="addMessage"
        @clearInitial="() => (inputText = '')"
      />
      <button class="toggle_btn" @click="isChatOpen = !isChatOpen">
        {{ isChatOpen ? "▼ 收起對話框" : "▲ 展開對話框" }}
      </button>
      <!-- Toast 訊息懸浮 -->
      <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onActivated, onUnmounted  } from "vue";
import Robot from "@/components/Robot.vue";
import Function from "@/components/function.vue";
import roomImage from "@/assets/image/room4.png";
import chat_bottom from "../components/chat_bottom.vue";
import botAvatar from "@/assets/image/avatar_bot.svg";
import userAvatar from "@/assets/image/avatar_user.svg";
import Greet1 from "@/assets/audio/welcome_01.wav";
import Greet2 from "@/assets/audio/welcome_02.wav";
import Greet3 from "@/assets/audio/welcome_03.wav";
import downUrl from "@/assets/audio/head_down.wav";
import upUrl from "@/assets/audio/head_up.wav";
import axios from "axios";
import { useWebGazer } from "@/composables/useWebGazer";
import { useBotAudio } from "@/composables/useBotAudio";
import { audioManager } from "@/composables/audioManager.js";
const { currentMsgId, isPlaying, stop } = useBotAudio();

// 角色正規化
const normalizeRole = (r) =>
  r === "assistant" || r === "system" || r === "bot" ? "bot" : "user";

const backgroundStyle = ref({
  backgroundImage: `url(${roomImage})`,
  backgroundPosition: "center",
});

//處理文字顯示
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const md = new MarkdownIt({
  breaks: true, // 讓 \n 變換行
  linkify: true, // 自動把網址變連結
  html: false, // 禁止原生 HTML（配合 DOMPurify 更安全）
});

function renderMarkdown(raw = "") {
  const html = md.render(String(raw));
  // 可選：限制允許的標籤（更嚴格）
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
      "blockquote",
      "a",
    ],
    ALLOWED_ATTR: ["href", "title", "target", "rel"],
  });
}

const isChatOpen = ref(false);
const inputText = ref("");
const messages = ref([]);

const toastMessage = ref("");
const toastVisible = ref(false);
const hasGreeted = ref(false);
const gazeCheckEnabled = ref(false);
const currentTitle = ref("");

function showToast(message, duration = 10000) {
  toastMessage.value = message;
  toastVisible.value = true;
  setTimeout(() => (toastVisible.value = false), duration);
}

// --- 放在頂層：控制動畫狀態 & 工具函式 ---
let isHiAnimating = false; // 防止重入（一次只跑一個 SayHi 流程）
const HI_COOLDOWN = 1200; // 節流：避免頻繁觸發
let lastHiAt = 0;

async function playUpWithHi() {
  const now = Date.now();
  if (now - lastHiAt < HI_COOLDOWN) return;
  lastHiAt = now;
  if (isHiAnimating) return;
  isHiAnimating = true;

  try {
    if (robotRef.value?.stopIdleLoop) robotRef.value.stopIdleLoop();

    // 音效 + SayHi 並行（不需等音檔結束）
    await Promise.all([
      audioManager
        .play({
          channel: "sfx",
          src: upUrl,
          duckOthers: false,
          fadeInMs: 40,
        })
        .catch(() => {}),
      robotRef.value?.SayHi ? robotRef.value.SayHi() : Promise.resolve(),
    ]);
  } finally {
    if (robotRef.value?.startIdleLoop) robotRef.value.startIdleLoop();
    isHiAnimating = false;
  }
}

const currentConversationId = ref(null);
const handleNewConversationId = (id) => (currentConversationId.value = id);

const handleOpenConversation = ({ conversationId, title, messages: hist }) => {
  currentConversationId.value = conversationId;
  currentTitle.value = title || "";
  messages.value = (hist || []).map((m) => ({
    role: normalizeRole(m.role),
    text: m.text ?? m.content ?? "",
    timestamp: m.timestamp,
  }));
  isChatOpen.value = true;
  nextTick(() => {
    if (dialogWrapper.value)
      dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  });
};

const addMessage = (msg) => {
  messages.value.push(msg);
  isChatOpen.value = true;
};

const setInputText = (msg) => {
  inputText.value = msg;
  if (!isChatOpen.value) isChatOpen.value = true;
  nextTick(() => {
    if (dialogWrapper.value)
      dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  });
};

const loadConversationById = async (conversationId) => {
  if (!conversationId) return;
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/gpt/get_conversation",
      { conversation_id: conversationId },
      { headers: { Authorization: token } }
    );
    const hist = (res.data.messages || []).map((m) => ({
      role: normalizeRole(m.role),
      text: m.text ?? m.content ?? "",
      timestamp: m.timestamp,
    }));
    currentConversationId.value = conversationId;
    currentTitle.value = res.data.title || currentTitle.value || "";
    messages.value = hist;
    isChatOpen.value = true;
    await nextTick();
    if (dialogWrapper.value)
      dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  } catch (err) {
    console.error("❌ home 載入歷史失敗", err);
  }
};

const tryLoadFromSession = () => {
  const convId = sessionStorage.getItem("conversation_id");
  if (convId) loadConversationById(convId);
};
onMounted(tryLoadFromSession);
if (onActivated) onActivated(tryLoadFromSession);

// Live2D 機器人
const robotRef = ref(null);
const motionSet = (fn) => fn();

// （可選）簡易節流，避免疊音
let lastDownAt = 0;
const THROTTLE = 1000;
function playDownThrottled() {
  const now = Date.now();
  if (now - lastDownAt > THROTTLE) {
    lastDownAt = now;
    audioManager
      .play({
        channel: "sfx",
        src: downUrl,
        duckOthers: false,
        fadeInMs: 40,
      })
      .catch(() => {});
  }
}

// 問候語音
const greetingAudios = [Greet1, Greet2, Greet3];
const pageGreetingKey = "greeted:home";

onMounted(() => {
  // 若已問候過，僅啟用視線偵測
  if (sessionStorage.getItem(pageGreetingKey)) {
    gazeCheckEnabled.value = true;
    return;
  }

  const randomIndex = Math.floor(Math.random() * greetingAudios.length);
  const selectedGreeting = greetingAudios[randomIndex];

  const handler = async (event) => {
    // 點到小精靈就不播
    if (event?.target?.closest?.(".elf-button")) {
      window.removeEventListener("click", handler);
      gazeCheckEnabled.value = true;
      return;
    }

    // ✅ 使用 audioManager 播放問候語（不 duck 其他）
    await audioManager.play({
      channel: "greeting",
      src: selectedGreeting,
      duckOthers: false,
      fadeInMs: 120,
      onStart: () => {
        if (randomIndex === 0) showToast("哈囉哈囉!最近一切順利嗎?");
        if (randomIndex === 1) showToast("今天過得如何呀?");
        if (randomIndex === 2) showToast("嗨嗨!讓我來陪你複習英文吧!");
      },
    });

    // Live2D 打招呼（與問候音可並行）
    if (robotRef.value?.stopIdleLoop) robotRef.value.stopIdleLoop();
    if (robotRef.value?.SayHi) await robotRef.value.SayHi();
    if (robotRef.value?.startIdleLoop) robotRef.value.startIdleLoop();

    sessionStorage.setItem(pageGreetingKey, "true"); // 只播一次
    window.removeEventListener("click", handler);
    gazeCheckEnabled.value = true;
  };

  window.addEventListener("click", handler);
});

const dialogWrapper = ref(null);
watch([() => messages.value.length, () => isChatOpen.value], async () => {
  await nextTick();
  if (dialogWrapper.value)
    dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
});

// WebGazer 回呼：把 down/up.play() 改為播放實例（或用節流版）
const { isLooking, gazeX, gazeY } = useWebGazer(
  (data, timestamp) => {
    if (!gazeCheckEnabled.value) return;
    // console.log("視線更新:", data.x.toFixed(2), data.y.toFixed(2));
  },
  () => {
    if (!gazeCheckEnabled.value) return;
    showToast("你認真讀書的樣子真棒！加油加油!");
    // playAudio(downAudio);
    playDownThrottled();
  },
  () => {
    if (!gazeCheckEnabled.value) return;
    showToast("你回來啦～有什麼需要我幫忙的嗎？");
    // playAudio(upAudio);
    playUpWithHi();
  }
);

// 重點整理
const summarizeConversation = async () => {
  try {
    const res = await axios.post(
      "http://localhost:5000/gpt/summarize",
      { conversation_id: currentConversationId.value },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    const summary = res.data.summary;
    messages.value.push({ role: "bot", text: "✅ 摘要完成" });
  } catch (err) {
    console.error("❌ 摘要失敗：", err.response?.data || err.message);
    messages.value.push({ role: "bot", text: "❌ 摘要失敗，請稍後再試。" });
  }
};

// 開新對話
// 開新對話（與 chatRight 相同邏輯）
const confirmReset = async () => {
  const wantsSummary = window.confirm(
    "你想在開始新對話前，先總結目前的對話紀錄嗎？"
  );
  try {
    if (wantsSummary) await summarizeConversation();

    const res = await axios.post(
      "http://localhost:5000/gpt/reset",
      {},
      { headers: { Authorization: localStorage.getItem("token") } }
    );

    const newId = res.data.conversation_id;
    const newTitle = res.data.title || "";
    // ✅ 同步前端狀態與 sessionStorage
    currentConversationId.value = newId;
    currentTitle.value = newTitle;
    sessionStorage.setItem("conversation_id", newId);

    // 清空畫面訊息，給提示
    messages.value = [];
    messages.value.push({ role: "bot", text: "🆕 已開啟新的對話！" });
    isChatOpen.value = true;

    await nextTick();
    if (dialogWrapper.value) {
      dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
    }
  } catch (err) {
    console.error("開啟新對話失敗", err);
    messages.value.push({ role: "bot", text: "開啟新對話失敗，請稍後再試。" });
  }
};

onUnmounted(() => {
  // 停掉語音類
  audioManager.stop("greeting");
  audioManager.stop("tts");
});

</script>

<style scoped>
.home_chatting_container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  position: absolute;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-weight: 600;
  bottom: 370px;
  width: 90%;
  background-color: #d1c5bd;
  padding: 5px 15px;
  text-align: center;
}

.tool_btn {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.summary_btn,
.reset_btn {
  border: 0px;
  background-color: #e8e1dc;
  width: 150px;
  font-size: 14px;
}

.summary_btn:hover,
.reset_btn:hover {
  box-shadow: 1px 1px 20px #acacac;
}

.toggle_btn {
  position: absolute;
  bottom: 46px; /* 根據 dialog_wrapper 高度微調 */
  right: 10%;
  transform: translateX(-50%);
  background-color: #ebe9e9;
  border: none;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
}
.toggle_btn:hover {
  background-color: #c9b8ac8e;
}
.container {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* 讓 .chatting 貼齊底部 */
}
.room_image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
}
.robot {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: -1;
  pointer-events: none;
}

.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.chatting {
  display: flex;
  flex-direction: column;
  align-items: center; /* 讓內容水平置中 */
  width: 100%;
  position: relative;
}

.leftArea {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tts-controls {
  margin-top: 4px;
}
.stop_btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: #ff6b6b;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  width: 28px;
}
.stop_btn:hover {
  opacity: 0.85;
}

.default {
  z-index: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 30px;
  margin: 0 20px 120px 20px;
}
.d1,
.d2,
.d3,
.d4 {
  background-color: #e8e1dc;
  border: 0;
  border-radius: 5px;
  padding: 8px 20px;
  box-shadow: 2px 2px 7px rgb(174, 174, 174);
}
.d1:hover,
.d2:hover,
.d3:hover,
.d4:hover {
  background-color: #dacbc0;
}
.dialog_wrapper {
  position: absolute;
  bottom: 100px;
  width: 90%;
  height: 250px; /* ❗根據畫面大小調整 */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.75);
  padding: 10px 15px;
  scroll-behavior: smooth;
}
.bubble {
  display: flex;
  align-items: flex-start;
}
.bubble.user {
  justify-content: flex-end;
}
.bubble.bot {
  justify-content: flex-start;
}
.text {
  background-color: #fefcfb;
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 70%;
  word-break: break-word;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin: 0 8px;
}

.gazer-demo {
  padding: 2rem;
  font-family: sans-serif;
}

/*關心對話筐*/
.toast {
  position: fixed;
  top: 120px;
  left: 51%;
  transform: translateX(-50%);
  background: #fff;
  background: rgba(255, 255, 255, 0.85); /* 半透明白底 */
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
  border-top-color: rgba(255, 255, 255, 0.85); /* 半透明 */
}

@keyframes fadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeout {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
