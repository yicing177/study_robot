<template>
  <!-- 上傳進度條 -->
  <div v-if="uploading || uploadCompleted" class="file_progessing">
    <div v-if="uploading" class="upload_progress">
      <div class="progress_bar">
        <div class="progress_fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p>{{ progress }}%</p>
    </div>
    <div v-if="uploadCompleted" class="upload_result">
      <p class="hint">上傳完成！</p>
      <button @click="viewFile">查看</button>
      <button @click="confirmUpload">確認</button>
    </div>
  </div>
  <div class="upload_btn">
    <input type="file" id="upload" @change="handleFileUpload" />
    <!--label的for對應到input type=file的id，就可以設定不同的css-->
    <label type="button" for="upload" class="upload_btn_style">
      <img src="../assets/logo/upload.svg" width="40" height="40" />
    </label>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const uploading = ref(false); // 控制是否顯示上傳進度
const uploadCompleted = ref(false); // 控制是否顯示完成按鈕
const progress = ref(0); // 模擬進度條

const selectedFile = ref(null);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile.value = file;

  // 開始模擬上傳
  uploading.value = true;
  uploadCompleted.value = false;
  progress.value = 0;

  const interval = setInterval(() => {
    if (progress.value >= 100) {
      clearInterval(interval);
      uploading.value = false;
      uploadCompleted.value = true;
    } else {
      progress.value += 5; // 每次加5%
    }
  }, 50); // 每100ms 更新一次
};

const router = useRouter();

const viewFile = () => {
  if (selectedFile.value) {
    const fileURL = URL.createObjectURL(selectedFile.value);

    // 儲存教材到 localStorage
    const savedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
    savedFiles.push({
      name: selectedFile.value.name,
      type: selectedFile.value.type,
      url: fileURL,
    });
    localStorage.setItem("uploadedFiles", JSON.stringify(savedFiles));

    router.push({
      path: "/file",
      query: { file: fileURL, type: selectedFile.value.type },
    });
  }
};
const confirmUpload = () => {
  if (selectedFile.value) {
    const fileURL = URL.createObjectURL(selectedFile.value);
    // 先取出舊資料
    const existing = JSON.parse(localStorage.getItem("uploadedFiles")) || [];

    // 加入新書籍資料
    existing.push({
      name: selectedFile.value.name,
      type: selectedFile.value.type,
      url: fileURL,
    });

    // 存回 localStorage
    localStorage.setItem("uploadedFiles", JSON.stringify(existing));
  }
  uploadCompleted.value = false;
  selectedFile.value = null;
};
</script>

<style scoped>
.file_progessing {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translate(-50%, -20%);
  width: 20%;
  background: white;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9999; /* 確保浮在最上面 */
  text-align: center;
}
.hint {
  margin: 0px;
  padding-bottom: 16px;
}
.upload_progress {
  margin: 20px auto 0;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平置中內容（包含進度條與文字） */
}

.progress_bar {
  width: 100%;
  height: 20px;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
}

.progress_fill {
  height: 100%;
  background-color: #c9b8ac;
  width: 0%;
  transition: width 0.2s;
}

.upload_result button {
  margin: 0px 20px;
  padding: 8px 16px;
  border: none;
  background-color: #c9b8ac;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  width: 30%;
}

/* 隱藏預設上傳檔案的醜醜按鈕 */
input[type="file"] {
  display: none;
}
</style>
