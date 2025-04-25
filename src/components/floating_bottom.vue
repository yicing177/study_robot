<template>
    <div
      class="floating-button"
      :class="{ animate: isAnimating }"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @mousemove="onDrag"
      @touchmove="onDrag"
      @mouseup="endDrag"
      @touchend="endDrag"
      @click="handleClick"
    >
      <img src="@/assets/girl-icon.png" alt="girl" />
    </div>
  </template>
  
  <script setup>
  export default {
    name: "FloatingBottom",
    data() {
      return {
        position: { x: 100, y: 300 },
        dragging: false,
        isAnimating: false,
      };
    },
    mounted() {
      const saved = localStorage.getItem("girlPosition");
      if (saved) {
        this.position = JSON.parse(saved);
      }
    },
    methods: {
      startDrag(event) {
        this.dragging = true;
      },
      onDrag(event) {
        if (!this.dragging) return;
        const e = event.type.includes("touch") ? event.touches[0] : event;
        this.position.x = e.clientX - 25;
        this.position.y = e.clientY - 25;
      },
      endDrag() {
        this.dragging = false;
        localStorage.setItem("girlPosition", JSON.stringify(this.position));
      },
      handleClick() {
        this.isAnimating = true;
        setTimeout(() => {
          this.$router.push("/home");
        }, 500); // 跳轉到主畫面
      },
    },
  };
  </script>
  
  <style scoped>
  .floating-bottom {
    position: fixed;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 9999;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .floating-bottom img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  .floating-bottom.animate {
    transform: scale(2);
    opacity: 0.5;
  }
  </style>
  