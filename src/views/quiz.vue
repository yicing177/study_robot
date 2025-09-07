<template>
  <div class="container">
    <div class="robot_container">
      <Robot />
    </div>
    <div class="chat_right_container">
      <chat_right
        :initialText="initialText"
        :messages="messages"
        :currentConversationId="currentConversationId"
        @updateConversationId="handleConversationIdUpdate"
        @updateMessages="addMessage"
      />
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  onDeactivated,
  watch,
} from "vue";
import Robot from "@/components/Robot.vue";
import chat_right from "@/components/chat_right.vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import Greet1 from "@/assets/audio/a_test_01.wav";
import Greet2 from "@/assets/audio/a_test_02.wav";
import Greet3 from "@/assets/audio/a_test_03.wav";
import { audioManager } from "@/composables/audioManager.js";

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

const pageGreetingKey = "greeted:quiz";
const greetingAudios = [Greet1, Greet2, Greet3];

const currentConversationId = ref(null); // 加這行
const handleConversationIdUpdate = (id) => {
  console.log("✅ quiz.vue 收到 conversation_id：", id);
  currentConversationId.value = id;
};
watch(currentConversationId, (newVal) => {
  console.log("📌 quiz.vue 中的 conversation_id 變成：", newVal);
});
onMounted(() => {
  // 已播過就不要重播（本頁只播一次）
  if (sessionStorage.getItem(pageGreetingKey)) return;

  const handler = async (e) => {
    // 點到小精靈按鈕不播放
    if (e?.target?.closest?.(".elf-button")) {
      window.removeEventListener("click", handler);
      return;
    }
    const idx = Math.floor(Math.random() * greetingAudios.length);
    const src = greetingAudios[idx];

    await audioManager
      .play({
        channel: "greeting",
        src,
        duckOthers: false, // 問候不壓別人；若此時有 TTS，會依優先權自動仲裁
        fadeInMs: 120,
      })
      .catch(() => {});

    sessionStorage.setItem(pageGreetingKey, "true");
    window.removeEventListener("click", handler);
  };
  window.addEventListener("click", handler);
});

// 離開本頁或被暫存（keep-alive）時，保險停掉語音
onUnmounted(() => {
  audioManager.stop("tts");
  audioManager.stop("greeting");
});
onDeactivated(() => {
  audioManager.stop("tts");
  audioManager.stop("greeting");
});
onBeforeRouteLeave(() => {
  audioManager.stop("tts");
  audioManager.stop("greeting");
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
