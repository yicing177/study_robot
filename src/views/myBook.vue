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
            <button v-if="!book.isPlaceholder" @click="viewFile(book)">
              <p>{{ book.name }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const currentShelf = ref("myBook"); // "myBook" 或 "summary"
const uploadedFiles = ref([]);
const summaries = ref([]); // 暫時為空，未來串後端放這邊

// 書架每層最多顯示的書本數
const booksPerRow = 5;

// 固定顯示三層，空位補上 placeholder
const bookRows = computed(() => {
  const rows = [];
  const source =
    currentShelf.value === "myBook" ? uploadedFiles.value : summaries.value;

  for (let i = 0; i < 3; i++) {
    const start = i * booksPerRow;
    const row = source.slice(start, start + booksPerRow);
    while (row.length < booksPerRow) {
      row.push({ name: "", isPlaceholder: true });
    }
    rows.push(row);
  }
  return rows;
});


onMounted(() => {
  const saved = JSON.parse(localStorage.getItem("uploadedFiles"));
  if (Array.isArray(saved)) {
    uploadedFiles.value = saved;
  }
  summaries.value = [
    { name: "4/10 文法整理", url: "", type: "text" },
    { name: "4/11 單字筆記", url: "", type: "text" },
    // 模擬的重點整理資料
  ];
});

//切換顯示的書架
const switchShelf = (shelfName) => {
  currentShelf.value = shelfName;
};

const viewFile = (book) => {
  const fileURL = book.url || book.file; // 替換成你實際存的欄位
  const fileType = book.type || "application/pdf";
  if (fileURL) {
    router.push({
      path: "/file",
      query: {
        file: fileURL,
        type: fileType,
      },
    });
  }
};
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
</style>
