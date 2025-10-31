<template>
  <button
    v-show="isButtonVisible"
    @click="toggleSidebar"
    class="function_btn"
    ref="buttonRef"
  >
    <img src="../assets/logo/function.svg" width="80" height="80" />
  </button>

  <div v-show="isSidebarVisible" class="sidebar" ref="sidebarRef">
    <ul>
      <button class="quiz" @click="navigateTo('/quiz')">
        <img src="../assets/logo/quiz.svg" width="20" />
        生成測驗
      </button>
      <button class="calendar" @click="navigateTo('/calendar')">
        <img src="../assets/logo/calendar.svg" width="20" />
        進度規劃
      </button>
      <button class="folder" @click="navigateTo('/myBook')">
        <img src="../assets/logo/folder.svg" width="20" />
        教材整理
      </button>
      <button class="history" @click="historyListOpen">
        <img src="../assets/logo/history.svg" width="20" />
        歷史對話
      </button>
    </ul>
  </div>

  <!-- 歷史清單：在原本每一筆旁加「✎」編輯鈕 -->
  <div v-show="showHistory" class="historyList">
    <button class="closeHistory" @click="historyListClose">關閉</button>

    <div v-for="item in historyList" :key="item.conversation_id" class="row">
      <button
        class="open_btn"
        @click="loadConversation(item.conversation_id, item.title)"
      >
        {{ item.title }}
      </button>
      <button
        class="edit_btn"
        title="重新命名"
        @click="openUpdateWindow(item.conversation_id, item.title)"
      >
        ✎
      </button>
    </div>
  </div>
  <div class="update">
    <div
      class="updateWindow"
      v-if="updateWindowVisible"
      @keydown.esc="closeUpdateWindow"
      @click.self="closeUpdateWindow"
    >
      <div class="dialog">
        <h3>重新命名對話</h3>
        <input
          ref="titleInput"
          v-model.trim="editingTitle"
          type="text"
          placeholder="輸入新標題"
          @keyup.enter="submitUpdate"
        />
        <div class="actions">
          <button class="ghost" @click="closeUpdateWindow">取消</button>
          <button
            class="primary"
            :disabled="
              pending || !editingTitle || editingTitle === originalTitle
            "
            @click="submitUpdate"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="message-panel" v-if="messages.length > 0">
    <h3>{{ currentTitle }}</h3>
    <div v-for="(msg, index) in messages" :key="index">
      <strong>{{ msg.role }}：</strong> {{ msg.text || msg.content }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, defineEmits, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { getAuth } from "firebase/auth";

//控制sidebar狀態
const isButtonVisible = ref(true);
const router = useRouter();
const route = useRoute();
const isSidebarVisible = ref(false);
const sidebarRef = ref(null);
const buttonRef = ref(null);
const currentConversationId = ref(null);

// 控制歷史對話列表
const showHistory = ref(false);

const historyListClose = () => {
  showHistory.value = false;
  isSidebarVisible.value = true;
  isButtonVisible.value = true;
};

// 切換功能列顯示狀態
const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value;
};

// 導航到指定路由，並自動收起功能列
const navigateTo = (path) => {
  isSidebarVisible.value = false;
  router.push(path);
};

// 點擊畫面任何地方都會收起 sidebar
const handleClickOutside = (event) => {
  if (
    isSidebarVisible.value && // 功能列已經展開
    sidebarRef.value &&
    !sidebarRef.value.contains(event.target) && // 點擊目標不是 sidebar 內部
    buttonRef.value &&
    !buttonRef.value.contains(event.target) // 點擊目標也不是按鈕
  ) {
    isSidebarVisible.value = false;
  }
};

// 監聽路由變化，收起功能列
watch(
  () => route.path,
  () => {
    isSidebarVisible.value = false;
  }
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

//對話名稱顯示出來
const historyList = ref([]);
const historyListOpen = async () => {
  showHistory.value = true;
  isSidebarVisible.value = false;
  isButtonVisible.value = false;

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    alert("請重新登入");
    return;
  }

  const token = await user.getIdToken();
  try {
    const res = await axios.get("http://localhost:5000/gpt/conversations", {
      headers: {
        Authorization: token,
      },
    });
    console.log("✅ 取得對話清單", res.data);
    historyList.value = res.data.conversations || [];
  } catch (err) {
    console.error("❌ 無法取得對話列表", err);
  }
};

//對話內容顯示出來
const messages = ref([]);
const currentTitle = ref("");
const selectedHistory = ref(null); // 用來記住目前開啟的 conversationId

// ✅ 讀取某筆對話後，上拋給父層（不要只自己顯示）
const emit = defineEmits(["openConversation", "titleUpdated"]);
const loadConversation = async (conversationId, title) => {
  if (selectedHistory.value === conversationId) {
    selectedHistory.value = null;
    return;
  }
  currentTitle.value = title;

  const user = getAuth().currentUser;
  if (!user) return alert("請重新登入");
  const token = await user.getIdToken();

  try {
    const res = await axios.post(
      "http://localhost:5000/gpt/get_conversation",
      { conversation_id: conversationId },
      { headers: { Authorization: token } }
    );

    const hist = (res.data.messages || []).map((m) => ({
      role: m.role,
      text: m.text || m.content, // 後端欄位是 content
      timestamp: m.timestamp,
    }));

    // ✅ 把「選到的對話」交給父層處理
    emit("openConversation", {
      conversationId,
      title: res.data.title || title || "未命名對話",
      messages: hist,
    });

    selectedHistory.value = conversationId;
    showHistory.value = false;

    sessionStorage.setItem("conversation_id", conversationId);
    sessionStorage.setItem(
      "conversation_title",
      res.data.title || title || "未命名對話"
    );
  } catch (err) {
    console.error("❌ 無法取得歷史訊息", err);
  }
};

// ===== 視窗狀態 =====
const updateWindowVisible = ref(false);
const editingId = ref(null);
const originalTitle = ref("");
const editingTitle = ref("");
const pending = ref(false);
const titleInput = ref(null);

// 通知父層用（例如去同步列表/右上標題）
// const emit = defineEmits(["titleUpdated"]);

// 打開視窗：自動帶入原標題並聚焦輸入框
function openUpdateWindow(conversationId, title) {
  editingId.value = conversationId;
  originalTitle.value = title || "";
  editingTitle.value = title || "";
  updateWindowVisible.value = true;
  nextTick(() => titleInput.value && titleInput.value.focus());
  showHistory.value = false;
}

// 關閉並清空狀態
function closeUpdateWindow() {
  updateWindowVisible.value = false;
  pending.value = false;
  editingId.value = null;
  originalTitle.value = "";
  editingTitle.value = "";
}

// 送出更新
async function submitUpdate() {
  if (!editingId.value) return;
  const newTitle = (editingTitle.value || "").trim();
  if (!newTitle || newTitle === originalTitle.value) {
    closeUpdateWindow();
    return;
  }
  pending.value = true;
  try {
    const token = await getAuth().currentUser?.getIdToken();
    await axios.post(
      "/gpt/update_title",
      { conversation_id: editingId.value, title: newTitle },
      { headers: { Authorization: token } }
    );
    // ✅ 本地列表同步（historyList 立即更新顯示）
    const idx = historyList.value.findIndex(
      (h) => h.conversation_id === editingId.value
    );
    if (idx !== -1) historyList.value[idx].title = newTitle;

    // 通知父層同步（列表/目前顯示中的標題）
    emit("titleUpdated", { conversationId: editingId.value, title: newTitle });

    // （可選）同步 sessionStorage，給其他頁用
    if (sessionStorage.getItem("conversation_id") === editingId.value) {
      sessionStorage.setItem("conversation_title", newTitle);
    }
  } catch (err) {
    console.error("❌ 無法更新標題", err);
    alert("更新失敗，請稍後再試。");
  } finally {
    pending.value = false;
    closeUpdateWindow();
  }
}
</script>

<style scoped>
.update {
  position: relative;
}
.updateWindow {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ebe9e9;
  text-align: center;
  padding: 10px 40px;
  bottom: 350px;
  z-index: 999;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.row {
  width: 100%;
}

.open_btn {
  width: 80%;
}

.edit_btn {
  width: 20%;
  height: 100%;
}

.actions {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 1em 0em;
  gap: 10px;
}

.sidebar {
  left: 20px;
  padding: 0;
  width: 120px;
}

.sidebar ul {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  gap: 10px;
}

.sidebar button {
  padding: 10px;
  background-color: #e8e1dc;
  border: 0px;
  cursor: pointer;
  text-align: center;
  border-radius: 8px;
  width: 100px;
}
.function_btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: transparent;
  border: none;
  padding: 0;
  position: absolute; /* 如果你是絕對定位用 left/top */
  left: 40px;
  top: 40px;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
  display: flex; /* 確保裡面的 img 水平垂直置中 */
  align-items: center;
  justify-content: center;
}
.function_btn:hover {
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.3); /* 懸停時增加陰影 */
}
.quiz,
.calendar,
.folder,
.history {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.calendar:hover,
.folder:hover,
.quiz:hover,
.history:hover,
.historyList button:hover {
  background-color: #e8e1dca2;
}

.historyList {
  display: flex;
  flex-direction: column;
  height: -webkit-fill-available;
  width: 20%;
  position: fixed;
  z-index: 100;
  background-color: #c9b8ac;
  gap: 20px;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 10px;
}

.historyList button {
  padding: 10px;
  background-color: #e8e1dc;
  border: 0px;
}

/* 整條滾動軸 */
.historyList::-webkit-scrollbar {
  width: 10px;
}

/* 軌道（背景） */
.historyList::-webkit-scrollbar-track {
  background: #e8e1dc;
  border-radius: 5px;
}

/* 捲軸滑塊 */
.historyList::-webkit-scrollbar-thumb {
  background-color: #8a786f;
  border-radius: 10px;
}
.historyList::-webkit-scrollbar-thumb:hover {
  background-color: #5c4438;
}
</style>
