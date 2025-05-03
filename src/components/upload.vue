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
    <!--<label>的for對應到<input type=file>的id，就可以設定不同的css-->
    <label for="upload" class="upload_btn_style">
      <img :src="uploadIcon" width="40" height="40" />
    </label>
  </div>
</template>

<script setup>
import uploadIcon from "../assets/logo/upload.svg";
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const uploading = ref(false); // 控制是否顯示上傳進度
const uploadCompleted = ref(false); // 控制是否顯示完成按鈕
const progress = ref(0); // 模擬進度條
const uploadedMaterial = ref(null);
const selectedFile = ref(null);
const router = useRouter();

const handleFileUpload = async(event) => {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile.value = file;

  //初始化進度與上傳狀態
  uploading.value = true;
  progress.value = 0;
  
  // 建立 FormData 並傳給 Flask 後端  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", "test-user"); // 可以根據登入帳號改(待處理)
  formData.append("title", file.name);
  


  try {
    //真正發送請求」到 Flask 後端
    const res = await axios.post("http://localhost:5000/upload_material", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      //實際根據檔案大小計算上傳進度
      onUploadProgress: (e) => {
        progress.value = Math.round((e.loaded * 100) / e.total);
      },
    });
    //拿到後端回傳的 Firebase 儲存結果：URL、type、title
    uploadedMaterial.value = res.data.material;
    uploadCompleted.value = true;
  } catch (err) {
    console.error("上傳失敗", err);
    alert("上傳失敗，請再試一次！");
  } finally {
    uploading.value = false;
  }
};


const viewFile = () => {
  if (!uploadedMaterial.value) return;
  const { file_url: url, title, type } = uploadedMaterial.value;
  
    // 儲存教材到 localStorage
    const savedFiles = JSON.parse(localStorage.getItem("uploadedFiles")|| "[]");
    savedFiles.push({
      name: title, type, url
    });
    localStorage.setItem("uploadedFiles", JSON.stringify(savedFiles));

    router.push({
      path: "/file",
      query: { 
        file: url,         //  Firebase Storage 的 URL
        type: type,        // 檔案類型，例如 "application/pdf"
        title: title       //  顯示的名稱 },
      }     
    });
};
const confirmUpload = () => {
  if(!uploadedMaterial.value) return;
  const { url, title, type, name, user_id, upload_time } = uploadedMaterial.value;
    const existing = JSON.parse(localStorage.getItem("uploadedFiles") || "[]");

    
    // 加入 Firebase 上傳成功的教材資訊
  existing.push({
    name: name || title,  // 可根據實際欄位選擇
    title,
    type,
    url,
    user_id,
    upload_time,
  });

    // 存回 localStorage
    localStorage.setItem("uploadedFiles", JSON.stringify(existing));
  uploadCompleted.value = false;
  selectedFile.value = null;
  console.log("🚀 確認 Firebase 回傳的資料", uploadedMaterial.value);
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
