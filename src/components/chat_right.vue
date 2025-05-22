<template>
  <div class="background">
    <!-- 對話紀錄區 -->
    <div class="chat_right_dialog" ref="dialogWrapper">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['bubble', msg.role]"
      >
        {{ msg.text }}
      </div>
    </div>

    <!-- 輸入框與按鈕區 -->
    <div class="chat_box">
      <div class="upload_btn">
        <Upload />
      </div>
      <input
        id="box"
        v-model="inputText"
        placeholder="想生成什麼測驗呢？"
        @keydown.enter="sendMessage"
      />
      <div class="voice_btn">
        <img src="../assets/logo/voice.svg" width="40" height="40" />
      </div>
      <div class="send_btn" @click="sendMessage">
        <img src="../assets/logo/send.svg" width="40" height="40" />
      </div>
    </div>
  </div>
</template>

<script setup>
import Upload from "@/components/upload.vue";
import { ref, watch, nextTick } from "vue";
import axios from "axios";

// ✨ props 傳入初始訊息
const props = defineProps({
  initialText: String,
});

// ✏️ 本地 state
const inputText = ref("");
const messages = ref([]);
const dialogWrapper = ref(null);

// ✅ 自動捲到底部
watch(messages, async () => {
  await nextTick();
  if (dialogWrapper.value) {
    dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  }
});

// ✅ 發送訊息
const sendMessage = async () => {
  if (!inputText.value.trim()) return;

  const userMessage = inputText.value;
  inputText.value = "";
  messages.value.push({ role: "user", text: userMessage });

  try {
    const res = await axios.post("http://localhost:5000/ask", {
      message: userMessage,
      user_id: "test_user",
    });
    const botReply = res.data.reply;
    messages.value.push({ role: "bot", text: botReply });
  } catch (err) {
    messages.value.push({
      role: "bot",
      text: "發生錯誤，請稍後再試一次。",
    });
  }
};

// ✅ 偵測 initialText 並立即送出
watch(
  () => props.initialText,
  (newText) => {
    if (newText?.trim()) {
      inputText.value = newText;
      sendMessage();
    }
  },
  { immediate: true }
);

</script>

<style scoped>
.background {
  background-color: #e1d8d2;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.chat_right_dialog {
  position: relative;
  width: 85%;
  max-height: 80%;
  overflow-y: auto;
  padding: 10px 15px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  bottom: 10px;
}

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 10px;
  word-break: break-word;
  font-size: 14px;
}
.bubble.user {
  background-color: #a68c7c;
  color: white;
  align-self: flex-end;
}
.bubble.bot {
  background-color: #ffffff;
  align-self: flex-start;
}

.chat_box {
  width: 85%;
  border-radius: 10px;
  background-color: #c9b8ac;
  padding: 15px 20px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  z-index: 100;
  margin-bottom: 15px;
}

input#box {
  flex: 1;
  border-radius: 10px;
  border: 0px;
  padding: 10px;
  font-size: 14px;
}

.voice_btn,
.upload_btn,
.send_btn {
  display: flex;
  justify-content: center;
}
</style>
