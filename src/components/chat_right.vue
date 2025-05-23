<template>
  <div class="background">
    <div class="chat_right_dialog" ref="dialogWrapper">
      <div v-for="(msg, i) in messages" :key="i" :class="['bubble', msg.role]">
        <!-- 顯示訊息 -->
        <template v-if="!msg.type || msg.type === 'text'">
          {{ msg.text }}
        </template>

        <!-- 顯示難度選擇按鈕 -->
        <template v-else-if="msg.type === 'buttons'">
          <div>{{ msg.text }}</div>
          <div class="button_group">
            <button
              v-for="btn in msg.buttons"
              :key="btn"
              class="difficulty_button"
              @click="selectDifficulty(btn)"
            >
              {{ btn }}
            </button>
          </div>
        </template>

        <!-- 顯示題數輸入框 -->
        <template v-else-if="msg.type === 'input'">
          <div class="num">
            <div>{{ msg.text }}</div>
            <input
              class="num_box"
              type="number"
              v-model="quizCount"
              placeholder="請輸入題數"
            />
            <button class="num_btn" @click="submitQuizCount">確認</button>
          </div>
        </template>

        <!-- 顯示題目+選項 -->
        <template v-else-if="msg.type === 'quiz'">
          <div class="quiz-question">
            <p>{{ msg.index + 1 }}. {{ msg.question }}</p>
            <div v-for="opt in msg.options" :key="opt">
              <label
                class="quiz-option"
                :class="{ selected: userAnswers[msg.index] === opt }"
              >
                <input
                  type="radio"
                  :name="'question_' + msg.index"
                  :value="opt"
                  v-model="userAnswers[msg.index]"
                />
                {{ opt }}
              </label>
            </div>
          </div>
        </template>
      </div>

      <!-- 顯示送出按鈕 -->
      <div
        v-if="quizSubmitted === false && quizQuestions.length > 0"
        class="submit_wrapper"
      >
        <button class="submit_button" @click="submitAnswers">送出答案</button>
      </div>
    </div>

    <!-- 輸入框 -->
    <div class="chat_box">
      <input
        id="box"
        v-model="inputText"
        placeholder="有問題想問問嗎？"
        @keydown.enter="sendMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from "vue";
import axios from "axios";

const inputText = ref("");
const messages = ref([]);
const props = defineProps({
  initialText: String,
  initialMessages: {
    type: Array,
    default: () => [],
  },
});
const dialogWrapper = ref(null);
const selectedDifficulty = ref(null);
const quizCount = ref("");
const userAnswers = ref({});
const quizQuestions = ref([]);
const quizSubmitted = ref(false);

onMounted(() => {
  messages.value.push(...props.initialMessages);
});

watch(messages, async () => {
  await nextTick();
  if (dialogWrapper.value) {
    dialogWrapper.value.scrollTop = dialogWrapper.value.scrollHeight;
  }
});

const selectDifficulty = (level) => {
  selectedDifficulty.value = level;
  messages.value.push({ role: "user", text: `我要選擇 ${level} 難度` });
  messages.value.push({ role: "bot", type: "input", text: "你想要幾題？" });
};

const submitQuizCount = async () => {
  const num = parseInt(quizCount.value);
  if (!num || !selectedDifficulty.value) return;

  messages.value.push({ role: "user", text: `我想要 ${num} 題` });

  try {
    const res = await axios.post("http://localhost:5000/quiz/generate_quiz", {
      difficulty: selectedDifficulty.value,
      num_questions: num,
    });

    const quiz = res.data.quiz;
    quizQuestions.value = quiz;

    quiz.forEach((q, idx) => {
      messages.value.push({
        role: "bot",
        type: "quiz",
        index: idx,
        question: q.question,
        options: q.options,
      });
    });

    quizSubmitted.value = false;
  } catch (err) {
    messages.value.push({ role: "bot", text: "出題失敗，請稍後再試。" });
  }
};

const submitAnswers = async () => {
  const answers = quizQuestions.value.map((q, i) => userAnswers.value[i] || "");

  try {
    const res = await axios.post("http://localhost:5000/quiz/submit", {
      questions: quizQuestions.value,
      answers: answers,
    });

    const result = res.data;
    messages.value.push({
      role: "bot",
      text: `✅ 你得了 ${result.score} / ${result.total} 分！`,
    });

    result.details.forEach((d, i) => {
      messages.value.push({
        role: "bot",
        text: `第 ${i + 1} 題：你答 ${d.user_answer}，正解是 ${
          d.correct_answer
        }\n解析：${d.explanation}`,
      });
    });

    quizSubmitted.value = true;
  } catch (err) {
    messages.value.push({ role: "bot", text: "提交失敗，請稍後再試一次。" });
  }
};

const sendMessage = async () => {
  if (!inputText.value.trim()) return;
  const userMessage = inputText.value;
  inputText.value = "";
  messages.value.push({ role: "user", text: userMessage });

  const res = await axios.post("http://localhost:5000/gpt/ask", {
    message: userMessage,
    user_id: "test_user",
  });
  messages.value.push({ role: "bot", text: res.data.reply });
};

//不要動這個位置
watch(
  () => props.initialText,
  (newText) => {
    if (newText?.trim()) {
      inputText.value = newText;
      sendMessage();
    }
  },
  { immediate: true }
);

</script>

<style scoped>
.background {
  background-color: #e1d8d2;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.chat_right_dialog {
  position: relative;
  width: 85%;
  max-height: 80%;
  overflow-y: auto;
  padding: 10px 15px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  bottom: 10px;
}

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 10px;
  word-break: break-word;
  font-size: 14px;
}
.bubble.user {
  background-color: #5c4438;
  color: white;
  align-self: flex-end;
}
.bubble.bot {
  background-color: #c1b1a6;
  align-self: flex-start;
}
.difficulty_button {
  display: flex;
  flex-direction: column;
  margin: 10px 0px;
  border: 0px;
  width: 150px;
  height: 35px;
  border-radius: 5px;
  background-color: #5c4438;
  color: white;
  justify-content: center;
}
.num {
  display: flex;
  flex-direction: column;
  gap: 5px
}
.num_box {
  background-color: #dfd5ce;
  height: 30px;
}
.num_btn {
  background-color: #5c4438;
  color: white;
  border: 0px;
  width: 50px;
}
.quiz-option {
  display: block;
  width: 80%;
  margin: 10px 0;
  padding: 12px 16px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background-color: #dfd5ce;
  color: black;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

/* hover 效果 */
.quiz-option:hover {
  background-color: #e6ded5;
}

/* ✅ 隱藏原本的 radio 按鈕 */
.quiz-option input[type="radio"] {
  display: none;
}

/* ✅ 被選中時，整塊 label 變色 */
.quiz-option.selected {
  background-color: #5c4438;
  color: white;
  border-color: #5c4438;
}

.chat_box {
  width: 85%;
  border-radius: 10px;
  background-color: #c9b8ac;
  padding: 15px 20px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  z-index: 100;
  margin-bottom: 15px;
}

input#box {
  flex: 1;
  border-radius: 10px;
  border: 0px;
  padding: 10px;
  font-size: 14px;
}

.voice_btn,
.upload_btn,
.send_btn {
  display: flex;
  justify-content: center;
}
</style>
