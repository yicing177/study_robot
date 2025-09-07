<template>
  <Function v-if="!showChatRight" />
  <Music v-if="!showChatRight" />
  <div :class="['file_container', { chat_mode: showChatRight }]">
    <div
      :class="[
        'preview_panel',
        { leftAlign: showChatRight, noRightChat: !showChatRight },
      ]"
    >
      <div class="file">
        <!-- 顯示文字筆記（summary 模式） -->
        <div v-if="isSummaryMode" class="summary_display">
          <h2>{{ summaryTitle }}</h2>
          <div class="summary_content">{{ summaryContent }}</div>
        </div>
        <div
          v-if="!isSummaryMode && fileType && fileType.startsWith('image')"
          class="image_container"
        >
          <img :src="fileURL" alt="Uploaded Image" class="image" />
        </div>

        <div
          v-else-if="!isSummaryMode && fileType === 'application/pdf'"
          class="pdf_container"
        >
          <div class="pdf_wrapper">
            <VuePdf
              :key="currentPages"
              :src="pdfSrc"
              :page="currentPages"
              :scale="0.75"
              class="pdf"
            />
          </div>
          <div class="page_btn">
            <button class="last_btn" @click="lastPage">上一頁</button>
            <p class="pages">
              第 {{ currentPages }} 頁 / 共 {{ totalPages }} 頁
            </p>
            <button class="next_btn" @click="nextPage">下一頁</button>
          </div>
        </div>

        <div v-else-if="!isSummaryMode">
          <p>無法預覽此類型的檔案，請下載查看。</p>
          <a :href="fileURL" download>下載檔案</a>
        </div>
      </div>
    </div>
    <div
      v-if="selectedText"
      class="highlight_options"
      :style="`top: ${highlightPosition.y}px; left: ${highlightPosition.x}px;`"
    >
      <button @click="sendHighlight('read')">朗讀</button>
      <button @click="sendHighlight('translate')">翻譯</button>
      <button @click="sendHighlight('examples')">更多例句</button>
    </div>

    <div class="btn_container">
      <button @click="showChatRight = !showChatRight" class="toggle_btn">
        {{ showChatRight ? "▶" : "◀" }}
      </button>
    </div>
    <div v-if="showChatRight" class="chat_right_panel">
      <!--ChatRight呼叫emit(updateMessages)時，也會觸發file的addMessage-->
      <ChatRight
        :key="chatKey"
        :initialText="initialRightInput"
        :messages="messages"
        :currentConversationId="currentConversationId"
        @updateMessages="addMessage"
        @resetMessages="resetMessages"
        @updateConversationId="handleUpdateConversationId"
      />
    </div>
    <div v-if="!showChatRight" class="chat_bottom">
      <ChatBottom
        :key="chatKey"
        :messages="messages"
        :currentConversationId="currentConversationId"
        @show="chatRightOpen"
        @updateMessages="addMessage"
        @sendWithText="handleSendWithText"
        @updateConversationId="handleUpdateConversationId"
      />
    </div>
  </div>
</template>

<script setup>
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { VuePdf, createLoadingTask } from "vue3-pdfjs";
import {
  ref,
  onMounted,
  watch,
  computed,
  onUnmounted,
  onDeactivated,
} from "vue";
import ChatBottom from "../components/chat_bottom.vue";
import ChatRight from "@/components/chat_right.vue";
import Function from "@/components/function.vue";
import Music from "../components/music.vue";
import { audioManager } from "@/composables/audioManager.js";
import axios from "axios";

const route = useRoute();
const showPreview = ref(false);
const fileURL = computed(() => route.query.file || "");
const fileType = computed(() => route.query.type || "");
const pdfSrc = ref("");
//PDF檔案的總頁數
const totalPages = ref(0);
const currentPages = ref(1);
const showChatRight = ref(false);
const initialRightInput = ref("");
const normalizeRole = (r) =>
  ["assistant", "system", "bot"].includes(r) ? "bot" : "user";
const currentConversationId = ref(null); // ✅ 宣告 reactive 狀態
const messages = ref([]);
const currentTitle = ref(null);

// ✅ 依 ID 載入歷史
const loadConversationById = async (conversationId) => {
  if (!conversationId) return;
  try {
    const token = localStorage.getItem("token"); // 你也可用 Firebase getIdToken
    const res = await axios.post(
      "http://localhost:5000/gpt/get_conversation",
      { conversation_id: conversationId },
      { headers: { Authorization: token } }
    );

    const hist = (res.data.messages || []).map((m) => ({
      role: normalizeRole(m.role),
      text: m.text || m.content || "",
      timestamp: m.timestamp,
    }));

    currentConversationId.value = conversationId;
    messages.value = hist;

    // 同步標題
    currentTitle.value = res.data.title || currentTitle.value;
  } catch (err) {
    console.error("❌ 載入歷史失敗", err);
  }
};

watch(currentConversationId, (newVal) => {
  console.log("📌 file.vue 中 currentConversationId 改變為：", newVal);
});

const handleUpdateConversationId = (id) => {
  console.log("🟢 收到新 conversation_id：", id);
  currentConversationId.value = id;
  if (id) {
    sessionStorage.setItem("conversation_id", id); // ✅ 同步給其他頁
  } else {
    sessionStorage.removeItem("conversation_id");
  }
};

const user_id = localStorage.getItem("user_id"); // ✅ 加這行

const addMessage = (msg) => {
  messages.value.push(msg); // 不用再加 { role: ..., text: ... }，因為子元件已經是處理好的物件
  showChatRight.value = true;
};

const props = defineProps({
  initialText: {
    type: String,
    default: "",
  },
});

onMounted(() => {
  if (fileType === "application/pdf") {
    const loadingTask = createLoadingTask(pdfSrc.value);
    loadingTask.promise.then((pdf) => {
      totalPages.value = pdf.numPages;
    });
  }
  // ✅ 進頁時試著接續 sessionStorage 的對話
  const convId = sessionStorage.getItem("conversation_id");
  if (convId) {
    loadConversationById(convId);
  }
});
//邱
watch(
  () => [fileURL.value, fileType.value],
  ([url, type]) => {
    pdfSrc.value = url;
    currentPages.value = 1;
    totalPages.value = 0;
    if (type === "application/pdf" && url) {
      createLoadingTask(url).promise.then((pdf) => {
        totalPages.value = pdf.numPages;
      });
    }
    //showPreview.value=true;
  },
  { immediate: true }
);
const isSummaryMode = computed(() => route.query.type === "summary");
const summaryTitle = computed(() => route.query.title || "重點整理");
const summaryContent = computed(() => route.query.content || "（無內容）");

const chatRightOpen = () => {
  showChatRight.value = true;
};
const handleSendWithText = async (text) => {
  initialRightInput.value = text;
  showChatRight.value = true;

  /*把訊息加入陣列當中
  messages.value.push({ role: "user", text: text }); */

  try {
    const res = await axios.post("http://localhost:5000/gpt/ask", {
      message: text,
      user_id: user_id, //邱改的
    });
    const botReply = res.data.reply;
    console.log("收到機器人回復", botReply);
    messages.value.push({
      role: "bot",
      text: botReply,
      conversation_id: res.data.conversation_id || null,
    }); // 顯示 GPT 回覆
  } catch (err) {
    console.error("GPT 回覆失敗", err);
  }
};

const lastPage = () => {
  if (currentPages.value > 1) {
    currentPages.value--;
    console.log("目前畫面：", currentPages.value);
  }
};

const nextPage = () => {
  if (currentPages.value < totalPages.value) {
    currentPages.value++;
    console.log("目前畫面：", currentPages.value);
  }
};

//反白
const selectedText = ref("");

const handleSelection = () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0) {
    selectedText.value = text;

    // 取得選取文字的範圍座標
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 記錄座標（加上捲動量 offset）
    highlightPosition.value = {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
    };
  } else {
    selectedText.value = "";
  }
};

onMounted(() => {
  window.addEventListener("mouseup", handleSelection);
});
onUnmounted(() => {
  window.removeEventListener("mouseup", handleSelection);
});

const highlightPosition = ref({ x: 0, y: 0 });
const sendHighlight = async (action) => {
  if (!selectedText.value) return;

  try {
    const res = await axios.post("http://localhost:5000/gpt/highlight_action", {
      user_id: user_id, //邱改的
      text: selectedText.value,
      action: action,
    });

    if (action === "read" && res.data.tts_url) {
      // ✅ 統一走 audioManager 的 tts channel
      // 若希望朗讀比目前 TTS 更優先，先停掉舊的 TTS（建議這樣做，體驗比較直覺）
      audioManager.stop("tts");
      await audioManager
        .play({
          channel: "tts",
          src: `http://localhost:5000${res.data.tts_url}`,
          duckOthers: true, // 自動壓低 BGM
          fadeInMs: 80,
        })
        .catch(() => {});
    } else if (action === "translate" && res.data.reply) {
      const sendMsg = "請幫我翻譯 " + selectedText.value;
      messages.value.push({ role: "user", text: sendMsg });
      showChatRight.value = true;
      messages.value.push({ role: "bot", text: res.data.reply });
    } else if (action === "examples" && res.data.reply) {
      const sendMsg = "我想知道 " + selectedText.value + " 的更多例句";
      messages.value.push({ role: "user", text: sendMsg });
      showChatRight.value = true;
      messages.value.push({ role: "bot", text: res.data.reply });
    }
    selectedText.value = "";
  } catch (err) {
    console.error("highlight_action 發生錯誤", err);
  }
};

const chatKey = ref(0); // 每次改變會強制重新渲染 ChatRight/ChatBottom

const resetMessages = () => {
  messages.value = []; // ✅ 這樣就能清空對話畫面
};

onDeactivated(() => {
  audioManager.stop("tts");
});

onBeforeRouteLeave(() => {
  audioManager.stop("tts");
});
</script>

<style scoped>
.preview_panel {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview_panel.leftAlign {
  width: 60%;
  display: flex;
  justify-items: center;
  transition: all 0.4s ease;
}
.preview_panel.noRightChat {
  margin-bottom: 5%;
}
.btn_container {
  display: flex;
  align-items: center;
}
.chat_right_panel {
  position: relative;
  width: 40%;
  background-color: #e1d8d2;
  overflow-y: auto;
}
.toggle_btn {
  height: 10%;
  background-color: #dfd5ce;
  border: 0px;
}
.toggle_btn:hover {
  box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.3);
}
.chat_bottom {
  position: absolute;
  bottom: 0;
  width: 100%;
}
.file_container {
  transition: all 0.4s ease;
  width: 100vw;
  display: flex;
  justify-content: center;
  flex-direction: row;
  height: 100vh;
}
.file_container.chat_mode {
  justify-content: space-between; /* 開啟 chat_right 時變成左右排 */
}
.file {
  padding: 30px 50px;
  top: 8%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #dfd5ce;
}
.summary_display {
  padding: 20px;
  background-color: #fdfdfd;
  border-radius: 10px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
  line-height: 1.6;
  overflow-y: auto;
  width: 100%;
  height: 400px;
}

.summary_display h2 {
  font-size: 1.25rem;
  margin-bottom: 10px;
}

.summary_content {
  font-size: 1rem;
}

.image_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.image {
  width: 60%;
}
.pdf_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  width: 100%;
  height: 100%;
}
.pdf_wrapper {
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page_btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
}
.pages {
  margin: 0;
}
.last_btn,
.next_btn {
  height: 30px;
  border: 0px;
  border-radius: 5px;
  background-color: #f0ece9;
}
.last_btn:hover,
.next_btn:hover {
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.3);
}
.highlight_options {
  position: absolute;
  background: #fffbe8;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px 10px;
  z-index: 999;
  display: flex;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
