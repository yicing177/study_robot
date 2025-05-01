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
        <VuePdf
          v-for="page in numOfPages"
          :key="page"
          :src="pdfSrc"
          :page="page"
        />
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
import { ref, onMounted } from "vue";
import chat_bottom from "../components/chat_bottom.vue";

const route = useRoute();

const fileURL = route.query.file || "";
const fileType = route.query.type || "";

const pdfSrc = ref(fileURL);
const numOfPages = ref(0);

onMounted(() => {
  if (fileType === "application/pdf") {
    const loadingTask = createLoadingTask(pdfSrc.value);
    loadingTask.promise.then((pdf) => {
      numOfPages.value = pdf.numPages;
    });
  }
});

console.log("fileType:", fileType);
console.log("fileURL:", fileURL);
</script>

<style scoped>
.image_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.image {
  width: 60%;
}
.pdf {
  height: 100%;
  width: 90%;
}
.pdf_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 90%;
  width: 100%;
}
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
</style>
