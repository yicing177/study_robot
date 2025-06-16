<template>
  <div class="chat_container">
    <div v-if="isRecording" class="recording_hint">
      🎤 錄音中... 再次點擊語音按鈕以停止
    </div>
    <div class="chat_box">
      <div class="upload_btn">
        <Upload />
      </div>
      <input v-model="inputText" placeholder="輸入您的問題..." id="box" />
      <div class="voice_btn" @click="toggleRecording">
        <img src="../assets/logo/voice.svg" width="40" height="40" />
      </div>
      <button class="send_btn" @click="sendMessage">
        <img src="../assets/logo/send.svg" width="40" height="40" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import Upload from "@/components/upload.vue";
import axios from "axios";

const emit = defineEmits(["updateMessages", "sendWithText"]);
const props = defineProps({
  initialText: {
    type: String,
    default: "",
  },
  handleSelfMessage: {
    type: Boolean,
    default: false,
  },
  messages: {
    type: Array,
    default: null, // ✅ 這個要加，讓它可以正確是 null
  },
});

//處理本地對話
const localMessages = ref([]);
const isUsingLocal = computed(
  () => props.messages === undefined || props.messages === null
);

const displayedMessages = computed(() =>
  isUsingLocal.value ? localMessages.value : props.messages
);
function appendMessage(message) {
  if (isUsingLocal.value) {
    localMessages.value.push(message);
    console.log("[local] 加入訊息：", message);
  } else {
    console.log("[emit] 要 emit 給父層：", message);
    emit("updateMessages", message);
  }
}

const inputText = ref(props.initialText);
// 如果 props.initialText 改變 → 更新 inputText
watch(
  () => props.initialText,
  (newVal) => {
    inputText.value = newVal;
  }
);
const sendMessage = async () => {
  //如果輸入框是空的就結束
  if (!inputText.value.trim()) return;

  emit("sendWithText", inputText.value);
  const userMessage = inputText.value;
  inputText.value = ""; // 清空輸入框
  appendMessage({ role: "user", text: userMessage });

  try {
    const res = await axios.post("http://localhost:5000/gpt/ask", {
      message: userMessage,
      user_id: "test_user",
    });

    const botReply = res.data.reply;
    appendMessage({ role: "bot", text: botReply });
    await speak(botReply);
  } catch (err) {
    console.error("GPT 回覆失敗", err);
  }
};
//機器人語音回復
const speak = async (text) => {
  try {
    const res = await axios.post("http://localhost:5000/routes/tts", {
      text: text, // 這裡後端要能接受 raw text
    });

    const audioPath = res.data.file;
    const audio = new Audio(
      `http://localhost:5000/dir_tts_result/${audioPath}`
    );
    audio.play();
  } catch (err) {
    console.error("語音播放失敗：", err);
  }
};
const isRecording = ref(false);

let audioContext, source, processor, audioData;

const toggleRecording = async () => {
  if (isRecording.value) {
    // ✅ 停止錄音
    processor.disconnect();
    source.disconnect();
    isRecording.value = false;

    const wavBuffer = encodeWAV(audioData, audioContext.sampleRate);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    uploadAndSend(blob);
    return;
  }

  // ✅ 開始錄音
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    audioData = [];
    processor.onaudioprocess = (e) => {
      audioData.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    isRecording.value = true;
  } catch (err) {
    console.error("無法開始錄音", err);
  }
};

function encodeWAV(buffers, sampleRate) {
  const length = buffers.reduce((acc, cur) => acc + cur.length, 0);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  let offset = 0;

  writeString(view, offset, "RIFF");
  offset += 4;
  view.setUint32(offset, 36 + length * 2, true);
  offset += 4;
  writeString(view, offset, "WAVE");
  offset += 4;
  writeString(view, offset, "fmt ");
  offset += 4;
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * 2, true);
  offset += 4;
  view.setUint16(offset, 2, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString(view, offset, "data");
  offset += 4;
  view.setUint32(offset, length * 2, true);
  offset += 4;

  let pos = offset;
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    for (let j = 0; j < buffer.length; j++, pos += 2) {
      const s = Math.max(-1, Math.min(1, buffer[j]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  return buffer;
}
async function uploadAndSend(blob) {
  const filename = `voice_${Date.now()}.wav`;
  const formData = new FormData();
  formData.append("file", blob, filename);

  try {
    // 上傳音訊檔案
    await axios.post("http://localhost:5000/routes/upload_audio", formData);

    // 呼叫 STT 轉文字
    const sttRes = await axios.post("http://localhost:5000/routes/stt", {
      filename,
    });

    const transcript = sttRes.data.transcript;
    const filepath = sttRes.data.file;

    // 🟢 只在這裡發送 GPT，避免再觸發 watch or props
    appendMessage({ role: "user", text: transcript });
    emit("show"); // 加在 uploadAndSend 的最後
    const gptRes = await axios.post("http://localhost:5000/gpt/ask_from_stt", {
      filepath,
      user_id: "test_user",
    });

    const botReply = gptRes.data.reply;

    appendMessage({ role: "bot", text: botReply.reply });
    await speak(botReply.reply);
  } catch (err) {
    console.error("語音處理錯誤", err);
    appendMessage({ role: "bot", text: "語音處理失敗，請稍後再試。" });
  }
}
/*
async function uploadAndSend(blob) {
  const filename = `voice_${Date.now()}.wav`;
  const formData = new FormData();
  formData.append("file", blob, filename);

  try {
    await axios.post("http://localhost:5000/routes/upload_audio", formData);
    const sttRes = await axios.post("http://localhost:5000/routes/stt", {
      filename,
    });
    emit("updateMessages", { role: "user", text: sttRes.data.transcript });
    const filepath = sttRes.data.file;

    const gptRes = await axios.post("http://localhost:5000/gpt/ask_from_stt", {
      filepath,
      user_id: "test_user",
    });
    emit("sendWithText", sttRes.data.transcript, true); // 加在 uploadAndSend 的最後
    const botReply = gptRes.data.reply;

    emit("updateMessages", { role: "bot", text: botReply.reply });
    console.log("語音回覆內容：", botReply);
    await speak(botReply.reply); // 🟢 只取出文字回應
  } catch (err) {
    console.error("語音處理錯誤", err);
  }
}
  */
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
