<template>
  <div class="container">
    <div class="robot_container">
      <Robot />
    </div>
    <div class="chat_right_container">
      <chat_right />
    </div>
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
  flex: 60%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  align-items: center;
  height: 100vh;
}
.chat_right_container {
  flex: 40%;
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
  transform-origin: bottom center;
  transform: scale(1.5);
  
}
</style>
