<template>
    <div class="container">
      <!-- 切換顯示/隱藏功能列的按鈕 -->
      <button @click="toggleSidebar" class="function_btn">
        ...
      </button>
  
      <!-- 使用 v-show 來顯示/隱藏功能列 -->
      <div v-show="isSidebarVisible" class="sidebar">
        <ul>
          <li>生成測驗題目</li>
          <li>學習進度規劃</li>
          <li>學習資源整理</li>
        </ul>
      </div>
  
      <!-- 顯示機器人 -->
      <Robot />
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import Robot from "@/components/Robot.vue"; // 確保 Robot 組件已正確引入
  
  // 用來控制功能列顯示/隱藏的狀態
  const isSidebarVisible = ref(false);
  
  // 切換功能列顯示狀態
  const toggleSidebar = () => {
    isSidebarVisible.value = !isSidebarVisible.value;
  };
  </script>
  
  <style scoped>
  .container {
    position: relative;
  }
  
  .sidebar {
    background-color: #f1aed1;
    padding: 10px;
    border: 1px solid #ccc;
    width: 200px;
    position: fixed; /* 讓功能列浮動 */
    left: 20px;
    z-index: 1; /* 保證功能列在前 */
    top: 70px;
  }
  
  .function_btn {
    position: fixed; /* 固定在畫面上 */
    top: 20px;
    left: 20px;
    z-index: 100; /* 確保按鈕在最上層 */
  }
  
  .robot {
    z-index: 2; /* 確保機器人顯示在功能列之上 */
  }
  </style>
  