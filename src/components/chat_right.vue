<template>
  <div class="background">
    <!-- 打包&新對話按鈕 -->
    <div class="btn_group">
      <button class="summary" @click="handleSummary">總結對話</button>
      <button class="reset" @click="confirmReset">開新對話</button>
    </div>
    <div class="chat_right_dialog" ref="dialogWrapper">
      <template v-for="(msg, i) in displayedMessages" :key="i">
        <!-- 顯示訊息 -->
        <div
          v-if="!msg.type || msg.type === 'text'"
          :class="['bubble', typeof msg.role === 'string' ? msg.role : 'bot']"
        >
          <span>
            {{
              typeof msg.text === "string"
                ? msg.text
                : msg.text &&
                  typeof msg.text === "object" &&
                  "reply" in msg.text
                ? msg.text.reply
                : JSON.stringify(msg.text)
            }}
          </span>
        </div>

        <!-- 顯示難度選擇按鈕 -->
        <div v-else-if="msg.type === 'buttons'" :class="['bubble', msg.role]">
          <div>{{ msg.text }}</div>
          <div class="button_group">
            <button
              v-for="btn in msg.buttons"
              :key="btn"
              class="difficulty_button"
              @click="selectDifficulty(btn)"
            >
              {{ btn }}
            </button>
          </div>
        </div>

        <!-- 顯示題數輸入框 -->
        <div v-else-if="msg.type === 'input'" :class="['bubble', msg.role]">
          <div class="num">
            <div>{{ msg.text }}</div>
            <input
              class="num_box"
              type="number"
              v-model="quizCount"
              placeholder="請輸入題數"
            />
            <button class="num_btn" @click="submitQuizCount">確認</button>
          </div>
        </div>

        <!-- 顯示題目+選項 -->
        <div v-else-if="msg.type === 'quiz'" :class="['bubble', msg.role]">
          <div class="quiz-question">
            <p>{{ msg.index + 1 }}. {{ msg.question }}</p>
            <div v-for="opt in msg.options" :key="opt">
              <label
                class="quiz-option"
                :class="{ selected: userAnswers[msg.index] === opt }"
              >
                <input
                  type="radio"
                  :name="'question_' + msg.index"
                  :value="opt"
                  v-model="userAnswers[msg.index]"
                />
                {{ opt }}
              </label>
            </div>
          </div>
        </div>
      </template>

      <!-- 顯示送出按鈕 -->
      <div
        v-if="quizSubmitted === false && quizQuestions.length > 0"
        class="submit_wrapper"
      >
        <button class="submit_button" @click="submitAnswers">送出答案</button>
      </div>
    </div>
    <!-- 輸入框 -->
    <div v-if="isRecording" class="recording_hint">
      🎤 錄音中... 再次點擊語音按鈕以停止
    </div>
    <div class="chat_box">
      <div class="upload_btn">
        <Upload />
      </div>
      <input
        id="box"
        v-model="inputText"
        placeholder="有問題想問問嗎？"
        @keydown.enter="sendMessage"
      />
      <div class="voice_btn" @click="toggleRecording">
        <img src="../assets/logo/voice.svg" width="40" height="40" />
      </div>
      <div class="send_btn" @click="sendMessage">
        <img src="../assets/logo/send.svg" width="40" height="40" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, nextTick } from "vue";
import axios from "axios";
import Upload from "@/components/upload.vue";
import { getAuth } from "firebase/auth";

const auth = getAuth();
const user_id = auth.currentUser?.uid;

const inputText = ref("");
const emit = defineEmits([
  "updateMessages",
  "sendWithText",
  "updateConversationId",
  "resetMessages",
]);
const props = defineProps({
  initialText: String,
  initialMessages: {
    type: Array,
    default: () => [],
  },
  messages: {
    type: Array,
    required: true,
  },
  currentConversationId: {
    type: String,
    default: null,
  },
});
//檢查哪邊沒傳進來
watch(
  () => props.currentConversationId,
  (newVal) => {
    console.log("👀 chat_right 收到 conversation_id:", newVal);
  },
  { immediate: true },

  nextTick(() => {
    if (dialogWrapper.value) {
      dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
    }
  })
);

//處理本地對話
const localMessages = ref([]);
const isUsingLocal = computed(() => !props.messages);

const displayedMessages = computed(() => {
  const messages = isUsingLocal.value ? localMessages.value : props.messages;

  return messages.map((msg) => {
    // 如果是 bot 且 msg.text 是 JSON 字串 → 嘗試解析
    if (
      msg.role === "bot" &&
      typeof msg.text === "string" &&
      msg.text.trim().startsWith("{")
    ) {
      try {
        const parsed = JSON.parse(msg.text);
        console.log("✅ 第", index, "個訊息成功 parse：", parsed); // ← 看這行有沒有印出來
        return { ...msg, text: parsed };
      } catch (e) {
        console.warn("❌ JSON.parse 失敗：", msg.text);
        return msg;
      }
    }
    return msg;
  });
});

function appendMessage(message) {
  if (props.messages) {
    emit("updateMessages", message); // 傳給父層
  } else {
    localMessages.value.push(message); // 自己管
  }
}

const dialogWrapper = ref(null);
const selectedDifficulty = ref(null);
const quizCount = ref("");
const userAnswers = ref({});
const quizQuestions = ref([]);
const quizSubmitted = ref(false);

const selectDifficulty = (level) => {
  selectedDifficulty.value = level;
  props.messages.push({ role: "user", text: `我要選擇 ${level} 難度` });
  props.messages.push({ role: "bot", type: "input", text: "你想要幾題？" });
};

const submitQuizCount = async () => {
  const num = parseInt(quizCount.value);
  if (!num || !selectedDifficulty.value) return;

  props.messages.push({ role: "user", text: `我想要 ${num} 題` });

  try {
    const res = await axios.post("http://localhost:5000/quiz/generate_quiz", {
      difficulty: selectedDifficulty.value,
      num_questions: num,
    });

    console.log("✅ API 回傳完整內容：", res.data);
    const quiz = res.data.quiz; // ✅ 這邊定義 quiz
    const message = res.data.message || "";
    quizQuestions.value = quiz;

    if (!quiz || quiz.length === 0) {
      props.messages.push({
        role: "bot",
        text: `⚠️ 出題失敗：${message || "請稍後再試。"}`,
      });
      return;
    }

    quiz.forEach((q, idx) => {
      appendMessage({
        role: "bot",
        type: "quiz",
        index: idx,
        question: q.question,
        options: q.options,
      });
    });
    console.log("✅ 從後端取得題目：", quiz);
    console.log("📥 現在的 displayedMessages：", displayedMessages.value);
    quizSubmitted.value = false;
  } catch (err) {
    props.messages.push({ role: "bot", text: "出題失敗，請稍後再試。" });
  }
};

const submitAnswers = async () => {
  const answers = quizQuestions.value.map((q, i) => userAnswers.value[i] || "");

  try {
    const res = await axios.post("http://localhost:5000/quiz/submit", {
      questions: quizQuestions.value,
      answers: answers,
    });

    const result = res.data;
    props.messages.push({
      role: "bot",
      text: `✅ 你得了 ${result.score} / ${result.total} 分！`,
    });

    result.details.forEach((d, i) => {
      props.messages.push({
        role: "bot",
        text: `第 ${i + 1} 題：你答 ${d.user_answer}，正解是 ${
          d.correct_answer
        }\n解析：${d.explanation}`,
      });
    });

    quizSubmitted.value = true;
  } catch (err) {
    props.messages.push({ role: "bot", text: "提交失敗，請稍後再試一次。" });
  }
};

const ensureConversationId = async (initialMessage = "我想開始對話") => {
  let conversationId = props.currentConversationId;
  let justCreated = false;
  let starterReply = null;

  if (!conversationId) {
    const res = await axios.post(
      "http://localhost:5000/gpt/start_conversation",
      { initial_message: initialMessage },
      { headers: { Authorization: localStorage.getItem("token") } } // 或 getIdToken()
    );
    conversationId = res.data.conversation_id;
    // starterReply = res.data.get("reply") ?? null; // 後端通常會回第一個回覆
    // 正確的取值方式（擇一或依實際回傳結構做 fallback）
    starterReply =
      res.data.reply ??
      res.data.first_reply ??
      res.data.message ??
      null;
    justCreated = true;
    emit("updateConversationId", conversationId);
    // 也可以同步 sessionStorage，和其他頁面一致
    sessionStorage.setItem("conversation_id", conversationId);
    console.log("📌 自動建立 conversation_id：", conversationId);
  }

  return { conversationId, justCreated, starterReply };
};

const sendMessage = async () => {
  if (!inputText.value.trim()) return;
  const userMessage = inputText.value;
  inputText.value = "";
  appendMessage({ role: "user", text: userMessage });

  console.log(
    "📤 準備送出訊息，conversation_id 是：",
    props.currentConversationId
  );

  const { conversationId, justCreated, starterReply } =
    await ensureConversationId(userMessage);
  try {
    if (justCreated) {
      // 🟢 新開對話：start_conversation 已經產生第一則回覆
      if (starterReply) {
        appendMessage({ role: "bot", text: starterReply });
        await speak(starterReply);
      }
      return; // 🚫 不要再 call /ask，避免重送一次相同訊息
    }

    // 🟢 已有對話：才用 /ask
    const res = await axios.post(
      "http://localhost:5000/gpt/ask",
      { message: userMessage, conversation_id: conversationId },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    const botReply = res.data.reply;
    appendMessage({
      role: "bot",
      text: botReply,
      conversation_id: res.data.conversation_id || null,
    });
    await speak(botReply);
  } catch (err) {
    props.messages.push({ role: "bot", text: "發生錯誤，請稍後再試。" });
  }
};

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
    //console.error("語音播放失敗：", err);
    console.error("語音播放失敗", err.response?.data || err.message);
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
    await axios.post("http://localhost:5000/routes/upload_audio", formData);
    const sttRes = await axios.post("http://localhost:5000/routes/stt", {
      filename,
    });
    appendMessage({ role: "user", text: sttRes.data.transcript });
    const filepath = sttRes.data.file;
    const conversationID = sessionStorage.getItem("conversation_id");

    const gptRes = await axios.post(
      "http://localhost:5000/gpt/ask_from_stt",
      {
        filepath,
        user_id: user_id, //邱改的
        conversation_id: conversationID,
      },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    console.log(gptRes);

    const botReply = gptRes.data.reply;
    console.log(botReply.reply);

    props.messages.push({ role: "bot", text: botReply.reply });
    console.log("語音回覆內容：", botReply);
    await speak(botReply.reply); // 🟢 只取出文字回應
  } catch (err) {
    console.error("語音處理錯誤", err);
  }
}

// if (!currentConversationId.value) {
//   emit("updateMessages", { role: "bot", text: "⚠️ 尚未開始對話，無法總結。" });
//   return;
// }

const handleSummary = async () => {
  try {
    const { conversationId } = await ensureConversationId("我想進行總結"); // ✅ 只拿字串
    const res = await axios.post(
      "http://localhost:5000/gpt/summarize",
      { conversation_id: conversationId },
      { headers: { Authorization: localStorage.getItem("token") } }
    );


    const summary = res.data.summary;
    console.log("✅ 摘要成功：",summary);
    
    emit("updateMessages", { role: "bot", text: "✅ 已加入重點整理！" });
  } catch (err) {
    console.error("總結失敗", err);
    emit("updateMessages", { role: "bot", text: "總結失敗，請稍後再試。" });
  }
};


const confirmReset = async () => {
  const wantsSummary = window.confirm(
    "你想在開始新對話前，先總結目前的對話紀錄嗎？"
  );

  if (wantsSummary) {
    await handleSummary(); // 呼叫總結函式
  }
  const convId = await ensureConversationId("我想進行總結");
  try {
    await axios.post("http://localhost:5000/gpt/reset");
    emit("updateMessages", { role: "bot", text: "🆕 已開啟新的對話！" });
    emit("updateConversationId", null); // ✅ 讓父層把 currentConversationId 設成 null
    // 這一段要通知父層清空 messages（額外 emit 一個事件）
    emit("resetMessages");
  } catch (err) {
    console.error("開啟新對話失敗", err);
    emit("updateMessages", {
      role: "bot",
      text: "開啟新對話失敗，請稍後再試。",
    });
  }
};
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
.btn_group {
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10%;
  background-color: #c9b8ac;
  padding: 15px 0px;
  top: 0px;
  right: 0px;
}
.summary,
.reset {
  width: 40%;
  background-color: #ffffff;
  border: 0px;
  border-radius: 10px;
  height: 30px;
  margin: 0px;
}
.summary:hover,
.reset:hover {
  background-color: #fffdfc9f;
}
.chat_right_dialog {
  position: relative;
  width: 90%;
  overflow-y: auto;
  padding: 10px 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 60px;
}
/* 整條滾動軸 */
.chat_right_dialog::-webkit-scrollbar {
  width: 5px;
}

/* 軌道（背景） */
.chat_right_dialog::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 5px;
}

/* 捲軸滑塊 */
.chat_right_dialog::-webkit-scrollbar-thumb {
  background-color: #a4a4a4;
  border-radius: 10px;
}
.chat_right_dialog::-webkit-scrollbar-thumb:hover {
  background-color: #636363;
}
.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 10px;
  word-break: break-word;
  font-size: 14px;
}
.bubble.user {
  background-color: #5c4438;
  color: white;
  align-self: flex-end;
}
.bubble.bot {
  background-color: #fffdfc9f;
  align-self: flex-start;
}
.difficulty_button {
  display: flex;
  flex-direction: column;
  margin: 10px 0px;
  border: 0px;
  width: 150px;
  height: 35px;
  border-radius: 5px;
  background-color: #c9b8ac;
  color: black;
  justify-content: center;
}
.difficulty_button:hover {
  background-color: #c9b8ac8e;
}
.num {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.num_box {
  background-color: #dfd5ce;
  height: 25px;
  border-color: #cabeb59d;
}
.num_btn,
.submit_button {
  background-color: #c9b8ac;
  color: black;
  border: 0px;
  width: 30%;
  padding: 3px;
  border-radius: 5px;
}
.num_btn:hover,
.submit_button:hover {
  background-color: #c9b8ac8e;
}
.quiz-option {
  display: block;
  width: 80%;
  margin: 10px 0;
  padding: 12px 16px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background-color: #dfd5ce;
  color: black;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

/* hover 效果 */
.quiz-option:hover {
  background-color: #e6ded5;
}

/* ✅ 隱藏原本的 radio 按鈕 */
.quiz-option input[type="radio"] {
  display: none;
}

/* ✅ 被選中時，整塊 label 變色 */
.quiz-option.selected {
  background-color: #5c4438;
  color: white;
  border-color: #5c4438;
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
