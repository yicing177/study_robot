<template>
  <div class="container">
    <div class="robot_container">
      <Robot />
    </div>
    <div class="chat_right_container">
      <chat_right
        :initialText="initialText"
        :messages="messages"
        @updateMessages="addMessage"
      />
    </div>
    <audio ref="greetingAudio"></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Robot from "@/components/Robot.vue";
import chat_right from "@/components/chat_right.vue";
import { useRoute } from "vue-router";
import Greet1 from "@/assets/audio/a_test_01.wav";
import Greet2 from "@/assets/audio/a_test_02.wav";
import Greet3 from "@/assets/audio/a_test_03.wav";

const route = useRoute();
const messages = ref([]); // ✅ 新增這個
const initialText = computed(() => route.query.init || "");
const quizStarter = [
  { role: "bot", text: "請問你想要什麼難度的測驗？" },
  {
    role: "bot",
    type: "buttons",
    buttons: ["easy", "medium", "hard"],
    text: "",
  },
];
const addMessage = (msg) => {
  messages.value.push(msg);
};
messages.value.push(...quizStarter); // ✅ 初始訊息丟進 messages

const greetingAudio = ref(null);
const greetingAudios = [Greet1, Greet2, Greet3];

onMounted(() => {
  const handler = () => {
    if (event.target.closest(".elf-button")) {
      console.log("🧚‍♀️ 小精靈被點了，不播放語音");
      return;
    }
    const randomIndex = Math.floor(Math.random() * greetingAudios.length);
    const selectedGreeting = greetingAudios[randomIndex];

    const audio = greetingAudio.value;
    audio.src = selectedGreeting;
    audio.volume = 1;
    audio.play();

    console.log("✅ 播放語音檔：", selectedGreeting);
    window.removeEventListener("click", handler); // 移除監聽器
  };

  window.addEventListener("click", handler);
});
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
  position: relative;
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
