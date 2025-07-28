<template>
  <div class="container">
    <div :style="backgroundStyle" class="room_image"></div>
    <Robot ref="robotRef" />
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

      <div v-if="isChatOpen" class="dialog_wrapper" ref="dialogWrapper">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['bubble', msg.role]"
        >
          <img
            :src="msg.role === 'bot' ? botAvatar : userAvatar"
            class="avatar"
          />
          <div class="text">{{ msg.text }}</div>
        </div>
      </div>
      <chat_bottom
        :initialText="inputText"
        :messages="messages"
        :handleSelfMessage="true"
        @updateMessages="addMessage"
      />
      <button class="toggle_btn" @click="isChatOpen = !isChatOpen">
        {{ isChatOpen ? "▼ 收起對話框" : "▲ 展開對話框" }}
      </button>
      <!-- Toast 訊息懸浮 -->
      <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
    </div>
  </div>
  <audio ref="greetingAudio"></audio>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import Robot from "@/components/Robot.vue";
import roomImage from "@/assets/image/room4.png";
import chat_bottom from "../components/chat_bottom.vue";
import botAvatar from "@/assets/image/avatar_bot.svg";
import userAvatar from "@/assets/image/avatar_user.svg";
import Greet1 from "@/assets/audio/welcome_01.wav";
import Greet2 from "@/assets/audio/welcome_02.wav";
import Greet3 from "@/assets/audio/welcome_03.wav";

const backgroundStyle = ref({
  backgroundImage: `url(${roomImage})`, // 使用導入的圖片路徑
  backgroundPosition: "center", // 置中
});

const isChatOpen = ref(false);
const inputText = ref(""); // 預設傳進 chat_bottom 的文字
const messages = ref([]); // 所有訊息紀錄

const toastMessage = ref("");
const toastVisible = ref(false);

const hasGreeted = ref(false);
const gazeCheckEnabled = ref(false);

function showToast(message, duration = 10000) {
  toastMessage.value = message;
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, duration);
}

const addMessage = (msg) => {
  console.log("收到訊息：", msg);
  messages.value.push(msg);
  isChatOpen.value = true;
};

const setInputText = (msg) => {
  inputText.value = msg;
};

const greetingAudio = ref(null);
const greetingAudios = [Greet1, Greet2, Greet3];

const robotRef = ref(null);
const motionSet = (fn) => {
  fn();
};
onMounted(async () => {
  const randomIndex = Math.floor(Math.random() * greetingAudios.length);
  const selectedGreeting = greetingAudios[randomIndex];

  const audio = greetingAudio.value;
  audio.src = selectedGreeting;
  audio.volume = 1;

  const handler = async () => {
    audio.play();

    if (randomIndex == 0) {
      showToast("哈囉哈囉!最近一切順利嗎?");
    }

    if (randomIndex == 1) {
      showToast("今天過得如何呀?");
    }

    if (randomIndex == 2) {
      showToast("嗨嗨!讓我來陪你複習英文吧!");
    }

    // 停掉 idle
    robotRef.value?.stopIdleLoop();
    await robotRef.value?.SayHi(); // ✅ 等它播完
    robotRef.value?.startIdleLoop(); // ✅ 播完再手動接回 idle

    console.log("✅ 播放語音檔：", selectedGreeting, randomIndex);
    window.removeEventListener("click", handler); // 移除監聽器
  };
  window.addEventListener("click", handler);
  gazeCheckEnabled.value = true;
});

const dialogWrapper = ref(null);

watch([() => messages.value.length, () => isChatOpen.value], async () => {
  await nextTick();
  if (dialogWrapper.value) {
    dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  }
});

import { useWebGazer } from "@/composables/useWebGazer";

// 從 hook 裡取得 gaze 資料 & 狀態
const { isLooking, gazeX, gazeY } = useWebGazer(
  (data, timestamp) => {
    console.log("視線更新:", data.x.toFixed(2), data.y.toFixed(2));
  },
  () => {
    console.log("看不到你了");
    showToast("你是不是低頭了？讀書加油喔！");
  },
  () => {
    console.log("抬頭啦");
    showToast("你回來啦～要我幫忙嗎？");
  }
);

/*
畫面載入後先說幾句話，延後啟用 gaze 偵測
onMounted(async () => {
  setTimeout(async () => {
    // 停掉 idle
    robotRef.value?.stopIdleLoop();

    // 播完再接回 idle
    await robotRef.value?.SayHi(); // ✅ 等它播完
    robotRef.value?.startIdleLoop(); // ✅ 播完再手動接回 idle
  }, 300);

  showToast("哈囉哈囉!最近一切順利嗎?");
  setTimeout(() => {
    showToast("有我陪你一起讀書喔！");
  }, 3500);
  setTimeout(() => {
    showToast("需要幫忙隨時跟我說～");
    gazeCheckEnabled.value = true;
  }, 7000);
});
*/
</script>

<style scoped>
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
  height: 220px; /* ❗根據畫面大小調整 */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.75);
  padding: 10px 15px;
  border-radius: 12px;
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
