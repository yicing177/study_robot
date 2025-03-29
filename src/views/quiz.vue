<template>
  <div class="container">
    <div class="robot_container">
      <Robot />
    </div>
    <chat_right />
  </div>
</template>

<script setup>
import Robot from "@/components/Robot.vue";
import chat_right from "@/components/chat_right.vue";
</script>

<style scoped>
.container {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}
.robot_container {
  flex: 65%;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.chat_right_container {
  flex: 35%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  height: 100vh;
}
.robot {
  width: 100%;
  height: 100vh;
  background-color: transparent;
  z-index: -1;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
}
::v-deep(canvas) {
  width: 120%;
  height: auto;
  transform-origin: center;
}
</style>
