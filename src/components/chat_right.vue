<!-- chatRight -->
<template>
  <div class="background">
    <!-- 總結提示 -->
    <div v-if="isSummary" class="summary_hint">總結中... 請稍後</div>
    <!-- 打包&新對話按鈕 -->
    <div class="btn_group">
      <button class="summary" @click="handleSummary">總結對話</button>
      <button class="reset" @click="confirmReset">開新對話</button>
    </div>

    <div class="chat_right_dialog" ref="dialogWrapper">
      <template v-for="(msg, i) in displayedMessages" :key="i">
        <!-- 純文字/一般訊息（預設） -->
        <div
          v-if="!msg.type || msg.type === 'text'"
          :class="['bubble', typeof msg.role === 'string' ? msg.role : 'bot']"
        >
          <!-- ✅ 只有當「這則 bot 訊息」正在播放時，才在訊息底下顯示停止按鈕 -->
          <div
            v-if="
              normalizeRole(msg.role) === 'bot' &&
              isPlaying &&
              msg.id === currentMsgId
            "
            class="tts_toolbar"
          >
            <button class="tts_stop_btn" @click="stop">⏹ 停止朗讀</button>
          </div>
          <!-- bot 訊息：安全渲染 Markdown（看到粗體/清單/換行） -->
          <div
            v-if="normalizeRole(msg.role) === 'bot'"
            class="text"
            v-html="renderMarkdown(extractText(msg.text))"
          ></div>

          <!-- user 訊息：維持純文字（避免使用者輸入破版） -->
          <span v-else class="text">
            {{ extractText(msg.text) }}
          </span>
        </div>

        <!-- 顯示難度選擇按鈕 -->
        <div
          v-else-if="msg.type === 'buttons'"
          :class="['bubble', normalizeRole(msg.role)]"
        >
          <div
            class="text"
            v-html="renderMarkdown(String(msg.text || ''))"
          ></div>
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
        <div
          v-else-if="msg.type === 'input'"
          :class="['bubble', normalizeRole(msg.role)]"
        >
          <div class="num">
            <div
              class="text"
              v-html="renderMarkdown(String(msg.text || ''))"
            ></div>
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
        <div
          v-else-if="msg.type === 'quiz'"
          :class="['bubble', normalizeRole(msg.role)]"
        >
          <div class="quiz-question">
            <p>
              {{ (msg.index ?? 0) + 1 }}.
              <span v-html="renderMarkdown(String(msg.question || ''))"></span>
            </p>
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

    <!-- 錄音提示 -->
    <div v-if="isRecording" class="recording_hint">
      🎤 錄音中... 再次點擊語音按鈕以停止
    </div>

    <!-- 輸入框 -->
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
import { onMounted, ref, watch, computed, nextTick, onUnmounted } from "vue";
import axios from "axios";
import Upload from "@/components/upload.vue";
import { getAuth } from "firebase/auth";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { useBotAudio } from "@/composables/useBotAudio";

// ✅ 直接解構出四個：play、stop、isPlaying、currentMsgId
const { play, stop, isPlaying, currentMsgId } = useBotAudio();

// === MarkdownIt 設定 ===
const md = new MarkdownIt({ breaks: true, linkify: true, html: false });
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const aIndex = tokens[idx].attrIndex("target");
  if (aIndex < 0) tokens[idx].attrPush(["target", "_blank"]);
  else tokens[idx].attrs[aIndex][1] = "_blank";
  tokens[idx].attrPush(["rel", "noopener noreferrer"]);
  return self.renderToken(tokens, idx, options);
};
function renderMarkdown(raw = "") {
  const html = md.render(String(raw));
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
  initialMessages: { type: Array, default: () => [] },
  messages: { type: Array, required: true },
  currentConversationId: { type: String, default: null },
});

// 角色正規化
const normalizeRole = (r) =>
  r === "assistant" || r === "system" || r === "bot" ? "bot" : "user";

// 把 msg.text 統一取出字串
function extractText(textLike) {
  if (typeof textLike === "string") return textLike;
  if (textLike && typeof textLike === "object" && "reply" in textLike)
    return String(textLike.reply ?? "");
  try {
    if (typeof textLike === "object") return JSON.stringify(textLike);
    return String(textLike ?? "");
  } catch {
    return String(textLike ?? "");
  }
}

// 統一從後端回傳拿出要「播放/呈現」的文字
function toReplyText(replyLike) {
  if (typeof replyLike === "string") return replyLike;
  if (replyLike && typeof replyLike === "object") {
    if ("reply" in replyLike && replyLike.reply) return String(replyLike.reply);
    if ("text" in replyLike && replyLike.text) return String(replyLike.text);
  }
  try {
    return String(replyLike ?? "");
  } catch {
    return "";
  }
}

watch(
  () => props.currentConversationId,
  (v) => console.log("👀 chat_right 收到 conversation_id:", v),
  { immediate: true }
);

// 本地/外部 messages
const localMessages = ref([]);
const isUsingLocal = computed(() => !props.messages);
const displayedMessages = computed(() => {
  const list = isUsingLocal.value ? localMessages.value : props.messages;
  return list.map((msg) => {
    if (
      normalizeRole(msg.role) === "bot" &&
      typeof msg.text === "string" &&
      msg.text.trim().startsWith("{")
    ) {
      try {
        return { ...msg, text: JSON.parse(msg.text) };
      } catch {
        return msg;
      }
    }
    return msg;
  });
});

function appendMessage(message) {
  if (props.messages) emit("updateMessages", message);
  else localMessages.value.push(message);
}

const dialogWrapper = ref(null);
watch(
  () => displayedMessages.value.length,
  async () => {
    await nextTick();
    if (dialogWrapper.value)
      dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  },
  { immediate: true }
);

// Quiz 狀態
const selectedDifficulty = ref(null);
const quizCount = ref("");
const userAnswers = ref({});
const quizQuestions = ref([]);
const quizSubmitted = ref(false);

const newMsgId = () => crypto?.randomUUID?.() || Date.now().toString(); // ✅ 新增

const selectDifficulty = (level) => {
  selectedDifficulty.value = level;
  appendMessage({ role: "user", text: `我要選擇 ${level} 難度` });
  appendMessage({ role: "bot", type: "input", text: "你想要幾題？" });
};

const submitQuizCount = async () => {
  const num = parseInt(quizCount.value);
  if (!num || !selectedDifficulty.value) return;

  appendMessage({ role: "user", text: `我想要 ${num} 題` });

  try {
    const res = await axios.post(
      "http://localhost:5000/quiz/generate_quiz",
      {
        difficulty: selectedDifficulty.value,
        num_questions: num,
        conversation_id: sessionStorage.getItem("conversation_id"),
      },
      { headers: { Authorization: localStorage.getItem("token") } }
    );

    const quiz = res.data?.quiz;
    const message = res.data?.message || "";
    quizQuestions.value = Array.isArray(quiz) ? quiz : [];

    if (!quizQuestions.value.length) {
      appendMessage({
        role: "bot",
        text: `⚠️ 出題失敗：${message || "請稍後再試。"}`,
      });
      return;
    }

    quizQuestions.value.forEach((q, idx) => {
      appendMessage({
        role: "bot",
        type: "quiz",
        index: idx,
        question: q.question,
        options: q.options,
      });
    });
    quizSubmitted.value = false;
  } catch {
    appendMessage({ role: "bot", text: "出題失敗，請稍後再試。" });
  }
};

const submitAnswers = async () => {
  const answers = quizQuestions.value.map((q, i) => userAnswers.value[i] || "");
  try {
    const res = await axios.post(
      "http://localhost:5000/quiz/submit",
      { questions: quizQuestions.value, answers },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    const result = res.data;
    appendMessage({
      role: "bot",
      text: `✅ 你得了 ${result.score} / ${result.total} 分！`,
    });
    result.details.forEach((d, i) => {
      appendMessage({
        role: "bot",
        text: `第 ${i + 1} 題：你答 ${d.user_answer}，正解是 ${
          d.correct_answer
        }\n解析：${d.explanation}`,
      });
    });
    quizSubmitted.value = true;
  } catch {
    appendMessage({ role: "bot", text: "提交失敗，請稍後再試一次。" });
  }
};

/** 確保拿到 conversationId；若沒有就先開新對話 */
const ensureConversationId = async (initialMessage = "我想開始對話") => {
  let conversationId = props.currentConversationId;
  let justCreated = false;
  let starterReply = null;

  if (!conversationId) {
    const res = await axios.post(
      "http://localhost:5000/gpt/start_conversation",
      { initial_message: initialMessage },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    conversationId = res.data.conversation_id;
    starterReply = res.data.reply ?? null;
    justCreated = true;

    emit("updateConversationId", conversationId);
    sessionStorage.setItem("conversation_id", conversationId);
  }
  return { conversationId, justCreated, starterReply };
};

const sendMessage = async () => {
  const raw = inputText.value ?? "";
  const userMessage = String(raw).trim();
  if (!userMessage) return;

  inputText.value = "";
  appendMessage({ role: "user", text: userMessage });

  const { conversationId, justCreated, starterReply } =
    await ensureConversationId(userMessage);
  try {
    if (justCreated) {
      if (starterReply) {
        const botId = newMsgId();
        const replyText = toReplyText(starterReply);
        appendMessage({ role: "bot", id: botId, text: replyText });
        await play(replyText, botId);
      }
      return;
    }

    const res = await axios.post(
      "http://localhost:5000/gpt/ask",
      { message: userMessage, conversation_id: conversationId },
      { headers: { Authorization: localStorage.getItem("token") } }
    );

    const botReply = res.data.reply;
    const replyText = toReplyText(botReply);
    const botId = newMsgId();
    appendMessage({
      role: "bot",
      id: botId,
      text: replyText,
      conversation_id: res.data.conversation_id || null,
    });
    await play(replyText, botId);
  } catch (err) {
    appendMessage({ role: "bot", text: "發生錯誤，請稍後再試。" });
  }
};

// 錄音 / STT
const isRecording = ref(false);
let audioContext, source, processor, audioData;

const toggleRecording = async () => {
  if (isRecording.value) {
    processor.disconnect();
    source.disconnect();
    isRecording.value = false;

    const wavBuffer = encodeWAV(audioData, audioContext.sampleRate);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    uploadAndSend(blob);
    return;
  }
  try {
    stop();

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
  /* 原樣保留 */
  const length = buffers.reduce((acc, cur) => acc + cur.length, 0);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++)
      view.setUint8(offset + i, string.charCodeAt(i));
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
      { filepath, user_id: user_id, conversation_id: conversationID },
      { headers: { Authorization: localStorage.getItem("token") } }
    );

    const botReply = gptRes.data.reply;
    const replyText = toReplyText(botReply);
    const botId = newMsgId();
    appendMessage({ role: "bot", id: botId, text: replyText });
    await play(replyText, botId);
  } catch (err) {
    console.error("語音處理錯誤", err);
  }
}

const isSummary = ref(false);
// 總結
const handleSummary = async () => {
  try {
    const { conversationId } = await ensureConversationId("我想進行總結");
    isSummary.value = true;
    const res = await axios.post(
      "http://localhost:5000/gpt/summarize",
      { conversation_id: conversationId },
      { headers: { Authorization: localStorage.getItem("token") } }
    );
    isSummary.value = false;
    appendMessage({ role: "bot", text: "✅ 已加入重點整理！" });
  } catch (err) {
    console.error("總結失敗", err);
    appendMessage({ role: "bot", text: "總結失敗，請稍後再試。" });
  }
};

// 開新對話（可選：先停播）
const confirmReset = async () => {
  const wantsSummary = window.confirm(
    "你想在開始新對話前，先總結目前的對話紀錄嗎？"
  );
  if (wantsSummary) await handleSummary();

  try {
    // 停止目前語音（避免殘留）
    stop(); // ✅ 可選

    const res = await axios.post(
      "http://localhost:5000/gpt/reset",
      {},
      { headers: { Authorization: localStorage.getItem("token") } }
    );

    const newId = res.data.conversation_id;
    emit("updateConversationId", newId);
    sessionStorage.setItem("conversation_id", newId);
    emit("resetMessages");
  } catch (err) {
    console.error("開啟新對話失敗", err);
    appendMessage({ role: "bot", text: "開啟新對話失敗，請稍後再試。" });
  }
};

onUnmounted(() => {
  // 停掉語音類
  stop();
});
</script>

<style scoped>
.recording_hint {
  position: absolute;
  background-color: #ffffff;
  padding: 20px 40px;
  z-index: 999;
  bottom: 500px;
  border-radius: 10px;
}
.summary_hint {
  position: absolute;
  background-color: #ffffff;
  padding: 20px 40px;
  z-index: 999;
  bottom: 500px;
  border-radius: 10px;
}
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

.tts_toolbar {
  margin-top: 4px;
}
.tts_stop_btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: #ff6b6b;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
.tts_stop_btn:hover {
  opacity: 0.85;
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
