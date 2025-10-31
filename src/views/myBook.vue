<template>
  <div class="myBook_container">
    <div class="layer_btn">
      <!--看curretShelf是什麼，決定哪個層架有active，就可以用css控制顏色-->
      <button
        class="shelf_btn"
        :class="{ active: currentShelf == 'myBook' }"
        @click="switchShelf('myBook')"
      >
        我的教材
      </button>
      <button
        class="shelf_btn"
        :class="{ active: currentShelf == 'summary' }"
        @click="switchShelf('summary')"
      >
        重點整理
      </button>
    </div>
    <div class="book_shelf">
      <div class="shelf" v-for="(row, rowIndex) in bookRows" :key="rowIndex">
        <div class="book-row">
          <div
            class="book-item"
            v-for="(book, index) in row"
            :key="index"
            :class="{ placeholder: book.isPlaceholder }"
          >
            <!-- <button v-if="!book.isPlaceholder" @click="viewFile(book)">
              <p>{{ book.title || book.summary_text?.slice(0, 10) }}</p>
            </button> -->
            <button
              class="book_title"
              v-if="!book.isPlaceholder"
              @click="viewFile(book)"
            >
              <p>{{ book.title || "未命名對話" }}</p>
            </button>
          </div>
        </div>
      </div>
      <div class="page_btn">
        <button
          class="last_btn"
          @click="prevPage"
          :disabled="currentPage === 1"
        >
          上一頁
        </button>
        <span class="pages">{{ currentPage }} / {{ maxPage }}</span>
        <button
          class="next_btn"
          @click="nextPage"
          :disabled="currentPage === maxPage"
        >
          下一頁
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onDeactivated } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { audioManager } from "@/composables/audioManager.js";
import { useRouter } from "vue-router";
import axios from "axios";
import ShelfSound1 from "@/assets/audio/a_material_01.wav";
import ShelfSound2 from "@/assets/audio/a_material_02.wav";

const router = useRouter();

const currentShelf = ref("myBook"); // "myBook" 或 "summary"
const shelfGreetKeys = {
  myBook: "greeted:shelf:myBook",
  summary: "greeted:shelf:summary",
};
const uploadedFiles = ref([]);
const summaries = ref([]); // 暫時為空，未來串後端放這邊

const booksPerRow = 5; // 書架每層最多顯示的書本數
const rowsPerPage = 3;
const currentPage = ref(1); // 🆕 目前是第幾頁

const bookRows = computed(() => {
  const source =
    currentShelf.value === "myBook"
      ? uploadedFiles.value || []
      : summaries.value || [];

  const startIndex = (currentPage.value - 1) * booksPerRow * rowsPerPage;
  const endIndex = startIndex + booksPerRow * rowsPerPage;
  const currentBooks = source.slice(startIndex, endIndex);

  const rows = [];
  for (let i = 0; i < currentBooks.length; i += booksPerRow) {
    const row = currentBooks.slice(i, i + booksPerRow);
    while (row.length < booksPerRow) {
      row.push({ name: "", isPlaceholder: true });
    }
    rows.push(row);
  }

  return rows;
});

const maxPage = computed(() => {
  const total =
    currentShelf.value === "myBook"
      ? uploadedFiles.value.length
      : summaries.value.length;
  return Math.ceil(total / (booksPerRow * rowsPerPage));
});

const nextPage = () => {
  if (currentPage.value < maxPage.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:5000/get_all_materials", {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });

    //書本排序照時間
    uploadedFiles.value = res.data.sort((a, b) => {
      return new Date(b.upload_time) - new Date(a.upload_time);
    });

    console.log("✅ 我的教材書架拿到的資料：", uploadedFiles.value);
  } catch (err) {
    console.error("❌ 我的教材無法取得書架資料", err);
  }

  // 進入頁面依當前書櫃播一次（同一個 session 僅一次）
  const key = shelfGreetKeys[currentShelf.value];
  if (!sessionStorage.getItem(key)) {
    const src = currentShelf.value === "myBook" ? ShelfSound1 : ShelfSound2;
    audioManager
      .play({
        channel: "greeting",
        src,
        duckOthers: false,
        fadeInMs: 120,
      })
      .catch(() => {});
    sessionStorage.setItem(key, "true");
  }
});

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:5000/gpt/history", {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });
    summaries.value = res.data.summaries || [];
    console.log("✅ 重點整理書架拿到的資料：", summaries.value);
  } catch (err) {
    console.error("❌ 重點整理無法取得書架資料", err);
  }
});
//切換顯示的書架
const switchShelf = (shelfName) => {
  currentShelf.value = shelfName;

const key = shelfGreetKeys[shelfName];
  if (!sessionStorage.getItem(key)) {
    const src = shelfName === "myBook" ? ShelfSound1 : ShelfSound2;
    audioManager.play({
      channel: "greeting",
      src,
      duckOthers: false,
      fadeInMs: 120,
    }).catch(() => {});
    sessionStorage.setItem(key, "true");
 }
};

const viewFile = (book) => {
  if (currentShelf.value === "summary") {
    // 🔥 是 summary 模式，就帶參數跳轉
    router.push({
      path: "/file",
      query: {
        type: "summary",
        title: book.title,
        content: book.summary, //這行一定要對應到
      },
    });
    return;
  }

  const fileURL = book.file_url; //|| book.file; // 替換成你實際存的欄位
  const fileType = book.type || "application/pdf";

  if (!fileURL) {
    console.error(" 找不到文件 URL");
    return;
  }

  if (fileURL) {
    router.push({
      path: "/file",
      query: {
        file: fileURL,
        type: fileType,
      },
    });
  } else {
    console.error("不能獨文件 url");
  }
};
onUnmounted(() => {
  audioManager.stop("tts");
  audioManager.stop("greeting");
  audioManager.stop("sfx");
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
.myBook_container {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  height: 100vh;
}
.layer_btn {
  display: flex;
  flex-direction: column;
}
.shelf_btn {
  font-size: 17px;
  background-color: #dfd5ce;
  border: 0;
  margin-top: 10px;
  border-radius: 5px 0px 0px 5px;
  height: 100px;
  writing-mode: vertical-rl;
  width: 50px;
  transition: background-color 0.3s ease;
  cursor: pointer;
}
.shelf_btn.active {
  background-color: #c9b8ac; /* 深色表示被選取 */
}
.book_shelf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 75%;
  background-color: #c9b8ac;
  padding: 40px 20px;
  box-shadow: 4px 4px rgba(0, 0, 0, 0.2);
}
.shelf {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #5c4438;
  height: 150px;
  position: relative;
  width: 90%;
  box-shadow: inset 0px 26px 77.3px -50px #000000;
}
.book-row {
  display: flex;
  justify-content: center;
  gap: 40px;
  position: relative;
  z-index: 1;
}
.book-item {
  width: 100px;
  height: 120px;
  background-color: #fff8dc;
  border: 2px solid #c8b890;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.book-item img {
  width: 50px;
  height: 50px;
}
.book-item p {
  font-size: 14px;
  word-break: break-word;
  margin: 0;
  text-align: center;
}
.book-item.placeholder {
  background-color: transparent;
  border: none;
  box-shadow: none;
}
.book_title {
  background-color: white;
  border: 1px solid;
  padding: 10px 5px;
  border-color: #c8b890;
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
  border: 0px;
  border-radius: 5px;
  background-color: #f0ece9;
}
.last_btn:hover,
.next_btn:hover {
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.3);
}
</style>
