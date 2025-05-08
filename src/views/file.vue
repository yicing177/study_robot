<template>
  <div class="file_container">
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
          <p class="pages">第 {{ currentPages }} 頁 / 共 {{ totalPages }} 頁</p>
          <button class="next_btn" @click="nextPage">下一頁</button>
        </div>
      </div>

      <div v-else>
        <p>無法預覽此類型的檔案，請下載查看。</p>
        <a :href="fileURL" download>下載檔案</a>
      </div>
    </div>
    <div class="chat_bottom">
      <chat_bottom />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { VuePdf, createLoadingTask } from "vue3-pdfjs";
import { ref, onMounted, watch,computed } from "vue";
import chat_bottom from "../components/chat_bottom.vue";

const route = useRoute();
const showPreview = ref(false)  
const fileURL  = computed(() => route.query.file  || '');
const fileType = computed(() => route.query.type  || '');
const pdfSrc   = ref('');
//PDF檔案的總頁數
const totalPages = ref(0);
const currentPages = ref(1);
//邱
watch(() => [fileURL.value, fileType.value],([url, type]) => {
    pdfSrc.value = url
    currentPages.value = 1
    totalPages.value = 0
    if (type === 'application/pdf' && url) {
      createLoadingTask(url).promise.then(pdf => {
        totalPages.value = pdf.numPages
      })
    }
    //showPreview.value=true;
  },
  { immediate: true }
  
)

onMounted(() => {
  if (fileType === "application/pdf") {
    const loadingTask = createLoadingTask(pdfSrc.value);
    loadingTask.promise.then((pdf) => {
      totalPages.value = pdf.numPages;
    });
  }
});

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

console.log("fileType:", fileType);
console.log("fileURL:", fileURL);
</script>

<style scoped>
.file_container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
}
.file {
  height: 70%;
  width: 70%;
  position: absolute;
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
.pages{
  margin: 0;
}
.last_btn,
.next_btn {
  height: 30px;
}
</style>
