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
  <!--這裡ID你可以再改 可能要和資料庫連 自動生成每份教材ID去抓-->
  <!--之後顯示對話名稱的邏輯是用資料庫內的對話名字和ID對應-->
  <!--你可以看我CHAT GPT第一個對話 我的想法在裡面-->
  <div v-show="showHistory"  class="historyList">
    <button
      v-for="item in historyList"
      :key="item.conversation_id"
      @click="loadConversation(item.conversation_id, item.title)"
    >
      {{ item.title }}
    </button>
    <button class="closeHistory" @click="historyListClose">關閉</button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from 'axios'
import { getAuth} from "firebase/auth"

//控制sidebar狀態
const isButtonVisible = ref(true);
const router = useRouter();
const route = useRoute();
const isSidebarVisible = ref(false);
const sidebarRef = ref(null);
const buttonRef = ref(null);
const currentTitle = ref('')
const messages = ref([])

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


const historyList = ref([])
const historyListOpen = async () => {

  showHistory.value = true;
  isSidebarVisible.value = false;
  isButtonVisible.value = false;

  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert("請重新登入")
    return
  }

  const token = await user.getIdToken()
  try {
    const res = await axios.get("http://localhost:5000/gpt/conversations", {
      headers: {
        Authorization: token
      }
    })
    console.log("✅ 取得對話清單", res.data)
    historyList.value = res.data.conversations || []
  } catch (err) {
    console.error("❌ 無法取得對話列表", err)
  }
}


</script>

<style scoped>
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
  height: 100vh;
  width: 20%;
  position: absolute;
  z-index: 100;
  background-color: #c9b8ac;
  gap: 10px;
}

.historyList button {
  padding: 10px;
  background-color: #e8e1dc;
  border: 0px;
}
</style>
