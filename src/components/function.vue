<template>
  <button @click="toggleSidebar" class="function_btn" ref="buttonRef">
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
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";

//控制sidebar狀態
const router = useRouter();
const route = useRoute();
const isSidebarVisible = ref(false);
const sidebarRef = ref(null);
const buttonRef = ref(null);

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
  left: 40px;
  top: 40px;
}
.quiz,
.calendar,
.folder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
