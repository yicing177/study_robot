<template>
  <div class="container">
    <div :style="backgroundStyle" class="room_image"></div>
    <Robot />
    <div class="chatting">
      <div class="default">
        <button class="d1" @click="setInputText ('明天要考試了好焦慮...')">明天要考試了好焦慮...</button>
        <button class="d2" @click="setInputText ('可以陪我聊聊嗎？')">可以陪我聊聊嗎？</button>
        <button class="d3" @click="setInputText ('今天要複習什麼呢？')">今天要複習什麼呢？</button>
        <button class="d4" @click="setInputText ('推薦今天適合的讀書音樂！')">推薦今天適合的讀書音樂！</button>
      </div>
      <chat_bottom :messages="messages" @updateMessages="addMessage" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
//導入其它組件
import Robot from "@/components/Robot.vue";
import roomImage from "@/assets/image/room4.png";
import chat_bottom from "../components/chat_bottom.vue";

const backgroundStyle = ref({
  backgroundImage: `url(${roomImage})`, // 使用導入的圖片路徑
  backgroundPosition: "center", // 置中
});

const messages = ref([]);

const setInputText = (message) => {
  document.getElementById('box').value = message;
};

const addMessage = (message) => {
  messages.value.push(message); 
};

</script>

<style scoped>
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
  width: 100%;
  height: 100%;
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
/*靠左版
.default {
  z-index: 0;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 112px;
  margin-left: 20px;
}
*/
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
</style>
