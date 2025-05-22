<template>
  <div :class="['file_container', { chat_mode: showChatRight }]">
    <div
      :class="[
        'preview_panel',
        { leftAlign: showChatRight, noRightChat: !showChatRight },
      ]"
    >
      <div class="file">
        <div
          v-if="fileType && fileType.startsWith('image')"
          class="image_container"
        >
          <img :src="fileURL" alt="Uploaded Image" class="image" />
        </div>

        <div v-else-if="fileType === 'application/pdf'" class="pdf_container">
          <div class="pdf_wrapper">
            <VuePdf
              :key="currentPages"
              :src="pdfSrc"
              :page="currentPages"
              :scale="0.75"
              class="pdf"
            />
          </div>
          <div class="page_btn">
            <button class="last_btn" @click="lastPage">上一頁</button>
            <p class="pages">
              第 {{ currentPages }} 頁 / 共 {{ totalPages }} 頁
            </p>
            <button class="next_btn" @click="nextPage">下一頁</button>
          </div>
        </div>

        <div v-else>
          <p>無法預覽此類型的檔案，請下載查看。</p>
          <a :href="fileURL" download>下載檔案</a>
        </div>
      </div>
    </div>

    <div v-if="showChatRight" class="chat_right_panel">
    <!--ChatRight呼叫emit(updateMessages)時，也會觸發file的addMessage-->
      <ChatRight
        :initialText="initialRightInput"
        :messages="messages"
        @updateMessages="addMessage"
      />
    </div>
    <div v-if="!showChatRight" class="chat_bottom">
      <ChatBottom
        :messages="messages"
        @updateMessages="addMessage"
        @sendWithText="handleSendWithText"
        v-if="!showChatRight"
      />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { VuePdf, createLoadingTask } from "vue3-pdfjs";
import { ref, onMounted, watch, computed } from "vue";
import ChatBottom from "../components/chat_bottom.vue";
import ChatRight from "@/components/chat_right.vue";
import axios from "axios";

const route = useRoute();
const showPreview = ref(false);
const fileURL = computed(() => route.query.file || "");
const fileType = computed(() => route.query.type || "");
const pdfSrc = ref("");
//PDF檔案的總頁數
const totalPages = ref(0);
const currentPages = ref(1);
const messages = ref([]);
const showChatRight = ref(false);
const initialRightInput = ref("");

const addMessage = (msg) => {
  messages.value.push({ role: "user", text: msg });
};

const props = defineProps({
  initialText: {
    type: String,
    default: "",
  },
});

onMounted(() => {
  if (fileType === "application/pdf") {
    const loadingTask = createLoadingTask(pdfSrc.value);
    loadingTask.promise.then((pdf) => {
      totalPages.value = pdf.numPages;
    });
  }
});
//邱
watch(
  () => [fileURL.value, fileType.value],
  ([url, type]) => {
    pdfSrc.value = url;
    currentPages.value = 1;
    totalPages.value = 0;
    if (type === "application/pdf" && url) {
      createLoadingTask(url).promise.then((pdf) => {
        totalPages.value = pdf.numPages;
      });
    }
    //showPreview.value=true;
  },
  { immediate: true }
);

const handleSendWithText = async (text) => {
  initialRightInput.value = text;
  showChatRight.value = true;

  //把訊息加入陣列當中
  messages.value.push({ role: "user", text }); 

  try {
    const res = await axios.post("http://localhost:5000/ask", {
      message: text,
      user_id: "test_user",
    });
    const botReply = res.data.reply;
    messages.value.push({ role: "bot", text: botReply }); // 顯示 GPT 回覆
  } catch (err) {
    console.error("GPT 回覆失敗", err);
  }
};

const lastPage = () => {
  if (currentPages.value > 1) {
    currentPages.value--;
    console.log("目前畫面：", currentPages.value);
  }
};

const nextPage = () => {
  if (currentPages.value < totalPages.value) {
    currentPages.value++;
    console.log("目前畫面：", currentPages.value);
  }
};

</script>

<style scoped>
.preview_panel {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.4s ease;
}
.preview_panel.leftAlign {
  width: 60%;
  display: flex;
  justify-items: center;
}
.preview_panel.noRightChat {
  margin-bottom: 5%;
}

.chat_right_panel {
  width: 40%;
  background-color: #e1d8d2;
  overflow-y: auto;
}

.chat_bottom {
  position: absolute;
  bottom: 0;
  width: 100%;
}
.file_container {
  transition: all 0.4s ease;
  width: 100vw;
  display: flex;
  justify-content: center;
  flex-direction: row;
  height: 100vh;
}
.file_container.chat_mode {
  justify-content: space-between; /* 開啟 chat_right 時變成左右排 */
}
.file {
  padding: 30px 50px;
  top: 8%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #dfd5ce;
}
.image_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.image {
  width: 60%;
}
.pdf_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  width: 100%;
  height: 100%;
}
.pdf_wrapper {
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page_btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
}
.pages {
  margin: 0;
}
.last_btn,
.next_btn {
  height: 30px;
}
</style>
