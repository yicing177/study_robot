<template>
  <div
    class="floating-button"
    :class="{ animate: isAnimating }"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
    @click="handleClick"
  >
    <img :src="girlIcon" class="girl-icon" />
  </div>
</template>

<script setup>
import girlIcon from '@/assets/image/tempImageVKGXox 3.png'; // ✅ 確保圖片名稱無錯字、空白要正確避開

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const position = ref({ x: 100, y: 300 });
const dragging = ref(false);
const isAnimating = ref(false);

const startDrag = () => {
  dragging.value = true;
};
const onDrag = (e) => {
  if (dragging.value) {
    position.value = {
      x: e.clientX - 30,
      y: e.clientY - 30
    };
  }
};
const endDrag = () => {
  dragging.value = false;
  localStorage.setItem('girlPosition', JSON.stringify(position.value));
};
const handleClick = () => {
  isAnimating.value = true;
  setTimeout(() => {
    router.push({ name: 'HomePage' }); // 確保你有定義 name: 'HomePage' 的路由
  }, 600);
};

onMounted(() => {
  const saved = localStorage.getItem("girlPosition");
  if (saved) {
    position.value = JSON.parse(saved);
  } else {
    position.value = {
      x: window.innerWidth - 80,
      y: window.innerHeight / 2 - 30
    };
  }
});
</script>

<style scoped>
.floating-button {
  position: fixed;
  width: 60px;
  height: 60px;
  cursor: pointer;
  z-index: 9999;

  background-color: rgba(255, 255, 255, 0.9); /* 白底，40% 透明 */
  border: 2px solid gray(0, 0, 0, 0.6);        /* 灰邊，40% 透明 */
  border-radius: 50%;

  transition: transform 2s cubic-bezier(0.4, 0, 0.2, 1), opacity 2s ease;
  opacity: 0.7; /* 整體半透明 */
}
.floating-button.animate {
  transform: scale(16);      /* 變大 */
  opacity: 0;               /* 淡出 */
}
.girl-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
</style>
