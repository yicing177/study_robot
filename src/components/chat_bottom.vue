<template>
  <div class="chat_container">
    <div v-if="isRecording" class="recording_hint">
      🎤 錄音中... 再次點擊語音按鈕以停止
    </div>
    <div class="chat_box">
      <div class="upload_btn">
        <Upload />
      </div>
      <input
        v-model="inputText"
        placeholder="輸入您的問題..."
        id="box"
        @keyup.enter="sendMessage()"
      />
      <div class="voice_btn" @click="toggleRecording">
        <img src="../assets/logo/voice.svg" width="40" height="40" />
      </div>
      <button class="send_btn" @click="sendMessage()">
        <img src="../assets/logo/send.svg" width="40" height="40" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import Upload from "@/components/upload.vue";
import axios from "axios";
import { getAuth } from "firebase/auth";

const emit = defineEmits([
  "updateMessages",
  "updateConversationId",
  "clearInitial",
  "show",
]);
const props = defineProps({
  initialText: { type: String, default: "" },
  currentConversationId: { type: String, default: null },
  handleSelfMessage: { type: Boolean, default: false },
  messages: { type: Array, default: null },
});

const auth = getAuth();
const user_id = auth.currentUser?.uid;

// ====== 訊息交給父層（若父層沒傳 messages，才用本地備援）======
const localMessages = ref([]);
const isUsingLocal = computed(
  () => props.messages === undefined || props.messages === null
);
const displayedMessages = computed(() =>
  isUsingLocal.value ? localMessages.value : props.messages
);
function appendMessage(message) {
  if (isUsingLocal.value) localMessages.value.push(message);
  else emit("updateMessages", message);
}

// ====== 輸入框 & initialText 自動送出 ======
const inputText = ref(props.initialText);
watch(
  () => props.initialText,
  (v) => (inputText.value = v)
);

// ✅ initialText 改變 → 自動送一次，並請父層清空（避免重複觸發）
watch(
  () => props.initialText,
  async (val) => {
    if (typeof val !== "string" || !val.trim()) return;
    emit("show"); // 打開右側
    await sendMessage(val);
    emit("clearInitial");
  }
);

// ====== 發送訊息（自己也能送，顯示在首頁）======
const sending = ref(false);
const sendMessage = async (forcedText) => {
  if (sending.value) return;
  const raw =
    typeof forcedText === "string" ? forcedText : inputText.value ?? "";
  const text = String(raw).trim();
  if (!text) return;

  sending.value = true;
  inputText.value = "";
  appendMessage({ role: "user", text }); // ✅ 先把自己的訊息顯示出來（父層會 push 到 dialog_wrapper）
  emit("show"); // 送出時打開右側

  try {
    // 如需驗證可啟用：
    const auth = getAuth();
    const token = await getAuth().currentUser?.getIdToken();
    const headers = { Authorization: token };

    // ✅ 先嘗試用現有 convId：父層 props 或 sessionStorage
    let convId =
      props.currentConversationId ||
      sessionStorage.getItem("conversation_id") ||
      null;

    if (!convId) {
      // 🟢 沒有 id：先建立對話
      const res = await axios.post(
        "http://localhost:5000/gpt/start_conversation",
        { initial_message: text },
        { headers }
      );
      const newId = res.data.conversation_id;
      emit("updateConversationId", newId); // ✅ 交給父層存
      convId = res.data.conversation_id;
      // 同步給父層 & 存到 sessionStorage，之後其他頁也能接
      emit("updateConversationId", convId);
      sessionStorage.setItem("conversation_id", convId);

      appendMessage({ role: "bot", text: res.data.reply }); // 立刻顯示 bot 回覆
    } else {
      // 🟢 有 id：延續對話
      const res = await axios.post(
        "http://localhost:5000/gpt/ask",
        { message: text, conversation_id: convId },
        { headers }
      );
      appendMessage({ role: "bot", text: res.data.reply });
    }
  } catch (err) {
    console.error("GPT 回覆失敗", err);
    appendMessage({ role: "bot", text: "發生錯誤，請稍後再試。" });
  } finally {
    sending.value = false;
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
    const conversationID = sessionStorage.getItem("conversation_id")

    // 🟢 只在這裡發送 GPT，避免再觸發 watch or props
    appendMessage({ role: "user", text: transcript });
    emit("show"); // 加在 uploadAndSend 的最後
    const gptRes = await axios.post(
      "http://localhost:5000/gpt/ask_from_stt",
      {
        filepath,
        user_id: user_id,
        conversation_id: conversationID,
      },
      { headers: { Authorization: localStorage.getItem("token") } }
    );

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
  border-radius: 50%;
}
</style>
