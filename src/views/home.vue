<template>
  <div class="container">
    <div :style="backgroundStyle" class="room_image"></div>
    <!-- 显示机器人 -->
    <Robot />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Robot from "@/components/Robot.vue"; // 确保 Robot 组件已正确引入
import roomImage from "@/assets/image/room4.png"; // 正确导入图片

const backgroundStyle = ref({
  backgroundImage: `url(${roomImage})`, // 使用导入的图片路径
  backgroundPosition: "center", // 确保背景图居中
});

onMounted(() => {
  console.log("图片路径：", roomImage); // 确保路径是否正确
});
</script>

<style scoped>
.container {
  position: relative;
  height: 100vh; /* 设置容器的高度为屏幕高度 */
}

.room_image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
