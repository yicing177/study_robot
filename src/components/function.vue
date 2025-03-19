<template>
  <button
    @mouseover="showSidebar"
    @mouseleave="hideSidebar"
    class="function_btn">
    <img src="../assets/logo/function.svg" width="80" height="80" />
  </button>
  <div v-show="isSidebarVisible" class="sidebar">
    <ul>
      <button>生成測驗題目</button>
      <button @click="$router.push({ path: '/calendar' })">學習進度規劃</button>
      <button @click="$router.push({ path: '/myBook' })">學習資源整理</button>
    </ul>
  </div>
</template>

<script setup>
import { ref } from "vue";
// 用來控制功能列顯示/隱藏的狀態
const isSidebarVisible = ref(false);

// 顯示功能列
const showSidebar = () => {
  isSidebarVisible.value = true;
};

// 隱藏功能列
const hideSidebar = () => {
  isSidebarVisible.value = false;
};
</script>

<style scope>
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
  background-color: rgb(199, 138, 159);
  border: 0px;
  cursor: pointer;
  text-align: center;
  border-radius: 8px;
  width: 100px;
}
</style>
