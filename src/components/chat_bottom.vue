<template>
  <div class="chat_container">
    <div class="chat_box">
      <div class="upload_btn">
        <Upload />
      </div>
      <input v-model="inputText" placeholder="輸入您的問題..." id="box" />
      <div class="voice_btn">
        <img src="../assets/logo/voice.svg" width="40" height="40" />
      </div>
      <button class="send_btn" @click="sendMessage">
        <img src="../assets/logo/send.svg" width="40" height="40" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import Upload from "@/components/upload.vue";
import axios from "axios";

const emit = defineEmits(["updateMessages"]);
const props = defineProps({
  initialText: {
    type: String,
    default: "",
  },
});

const inputText = ref(props.initialText);
// 如果 props.initialText 改變 → 更新 inputText
watch(
  () => props.initialText,
  (newVal) => {
    inputText.value = newVal;
  }
);
const sendMessage = async () => {
  if (!inputText.value.trim()) return;

  const userMessage = inputText.value;
  inputText.value = ""; // 清空輸入框

  // 顯示使用者訊息
  emit("updateMessages", { role: "user", text: userMessage });

  try {
    const res = await axios.post("http://localhost:5000/ask", {
      message: userMessage,
      user_id: "test_user",
    });

    const botReply = res.data.reply;
    emit("updateMessages", { role: "bot", text: botReply });
  } catch (err) {
    console.error("GPT 回覆失敗", err);
  }
};
</script>

<style scoped>
.file_progessing {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translate(-50%, -20%);
  width: 20%;
  background: white;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9999; /* 確保浮在最上面 */
  text-align: center;
}
.hint {
  margin: 0px;
  padding-bottom: 16px;
}
.upload_progress {
  margin: 20px auto 0;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平置中內容（包含進度條與文字） */
}

.progress_bar {
  width: 100%;
  height: 20px;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
}

.progress_fill {
  height: 100%;
  background-color: #c9b8ac;
  width: 0%;
  transition: width 0.2s;
}

.upload_result button {
  margin: 0px 20px;
  padding: 8px 16px;
  border: none;
  background-color: #c9b8ac;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  width: 30%;
}

/* 隱藏預設上傳檔案的醜醜按鈕 */
input[type="file"] {
  display: none;
}

#box {
  width: 90%;
  border-radius: 10px;
  border: 0px;
  padding: 10px;
}
.chat_container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chat_box {
  position: absolute;
  width: 90%;
  bottom: 25px;
  border-radius: 10px; /* 圓角 */
  background-color: #c9b8ac; /* 背景色 */
  padding: 15px 20px; /* 依序為上下、左右 */
  overflow-y: auto; /* 內容超出時可以滾動 */
  display: flex;
  flex-direction: row;
  gap: 10px;
}
.voice_btn,
.upload_btn,
.send_btn {
  display: flex;
  justify-content: center;
  border: 0;
  background-color: transparent;
}
</style>
