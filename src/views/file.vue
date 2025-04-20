<template>
  <div class="file_container">
    <div class="file">
      <div v-if="fileType.startsWith('image')" class="image_container">
        <img :src="fileURL" alt="Uploaded Image" class="image" />
      </div>

      <div v-else-if="fileType === 'application/pdf'" class="pdf_container">
        <iframe :src="fileURL" class="pdf" />
      </div>

      <div v-else>
        <p>無法預覽此類型的檔案，請下載查看。</p>
        <a :href="fileURL" download>下載檔案</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
const route = useRoute();

const fileURL = route.query.file;
const fileType = route.query.type;
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
.pdf{
  height: 100%;
  width: 60%;
}
.pdf_container{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60%;
  width: 100%;
}
.file_container {
  height: 100vh;
  width: 100vw;
}
.file {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
