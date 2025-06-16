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
  
  </div>
</template>

<script setup>
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
      x: e.clientX - 40,
      y: e.clientY - 40
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
      y: window.innerHeight / 2 - 40
    };
  }
});
</script>

<style scoped>
.floating-button {
  position: fixed;
  width: 80px;
  height: 80px;
  background-image: url('@/assets/image/girl_buttom.png'); /* 換你的圖 */
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  cursor: pointer;
  z-index: 9999;
  opacity:0.8;
  transition: transform 0.6s ease, opacity 0.6s ease;
}
.floating-button:hover {
  opacity: 70%;
}

.floating-button.animate {
  transform: scale(16);      /* 變大 */
  opacity: 0;              /* 淡出 */
}
.girl-icon {
  width: 90%;
  height: 90%;
  border-radius: 50%;
  object-fit: cover;
}
</style>
