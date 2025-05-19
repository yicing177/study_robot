<template>
  <div class="container">
    <div :style="backgroundStyle" class="room_image"></div>
    <Robot />
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
        @updateMessages="addMessage"
      />
      <button class="toggle_btn" @click="isChatOpen = !isChatOpen">
        {{ isChatOpen ? "▼ 收起對話框" : "▲ 展開對話框" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import Robot from "@/components/Robot.vue";
import roomImage from "@/assets/image/room4.png";
import chat_bottom from "../components/chat_bottom.vue";
import botAvatar from "@/assets/image/avatar_bot.svg";
import userAvatar from "@/assets/image/avatar_user.svg";

const backgroundStyle = ref({
  backgroundImage: `url(${roomImage})`, // 使用導入的圖片路徑
  backgroundPosition: "center", // 置中
});

const isChatOpen = ref(false);
const inputText = ref(""); // 預設傳進 chat_bottom 的文字
const messages = ref([]); // 所有訊息紀錄

const addMessage = (msg) => {
  messages.value.push(msg);
  isChatOpen.value = true;
};

const setInputText = (msg) => {
  inputText.value = msg;
};

const dialogWrapper = ref(null);
watch([messages, isChatOpen], async () => {
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
    alert("你是不是低頭了？讀書加油喔！");
  },
  () => {
    console.log("抬頭啦");
    alert("你回來啦～要我幫忙嗎？");
  }
);
</script>

<style scoped>
.toggle_btn {
  position: absolute;
  bottom: 46px; /* 根據 dialog_wrapper 高度微調 */
  right: 10%;
  transform: translateX(-50%);
  background-color: #eee;
  border: none;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
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
</style>

<style scoped>
.gazer-demo {
  padding: 2rem;
  font-family: sans-serif;
}
</style>
