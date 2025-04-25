import axios from "axios";
import { ref } from "vue";

export function useUploader() {
  const uploading = ref(false);
  const progress = ref(0);
  const uploadCompleted = ref(false);
  const uploadedMaterial = ref(null);

  const uploadFile = async (file, user_id = "test-user", title = "") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user_id);
    formData.append("title", title || file.name);

    uploading.value = true;
    progress.value = 0;
    uploadCompleted.value = false;

    try {
      const res = await axios.post("http://localhost:5000/upload_material", formData, {
        onUploadProgress: (e) => {
          progress.value = Math.round((e.loaded * 100) / e.total);
        },
      });

      uploading.value = false;
      uploadCompleted.value = true;
      uploadedMaterial.value = res.data.material;
      return res.data.material;
    } catch (error) {
      uploading.value = false;
      throw error;
    }
  };

  return {
    uploading,
    progress,
    uploadCompleted,
    uploadedMaterial,
    uploadFile
  };
}