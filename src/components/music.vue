<template>
  <!-- 音樂按鈕 -->
  <button @click="toggleMusicList" class="music_btn" ref="buttonRef">
    <img src="../assets/logo/music.svg" width="80" height="80" />
  </button>

  <!-- 音樂選單 -->
  <div v-show="isListVisible" class="List" ref="listRef">
    <ul>
      <button
        v-for="(music, index) in musicList"
        :key="index"
        @click="clickAudio(index)"
      >
        {{ music.name }}
        <audio ref="audioElements">
          <source :src="music.src" type="audio/ogg" />
        </audio>
      </button>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// 控制音樂選單顯示與否
const isListVisible = ref(false);
const buttonRef = ref(null);
const listRef = ref(null);

const toggleMusicList = () => {
  isListVisible.value = !isListVisible.value;
};

// 音樂清單
const musicList = ref([
  {
    name: "鋼琴伴奏",
    src: new URL("../assets/audio/鋼琴伴奏.mp3", import.meta.url).href,
  },
  {
    name: "細雨綿綿",
    src: new URL("../assets/audio/細雨綿綿.mp3", import.meta.url).href,
  },
  {
    name: "輕快輕鬆",
    src: new URL("../assets/audio/輕快輕鬆.mp3", import.meta.url).href,
  },
  {
    name: "爵士抒情",
    src: new URL("../assets/audio/爵士抒情.mp3", import.meta.url).href,
  },
  {
    name: "海浪輕擊",
    src: new URL("../assets/audio/海浪輕擊.mp3", import.meta.url).href,
  },
  {
    name: "鳥兒啾鳴",
    src: new URL("../assets/audio/鳥兒啾鳴.mp3", import.meta.url).href,
  },
]);

// 音樂元素的 ref 陣列
const audioElements = ref([]);

// 播放對應的音樂
const clickAudio = (index) => {
  if (audioElements.value[index]) {
    audioElements.value.forEach((audio) => audio.pause());
    audioElements.value[index].currentTime = 0;
    audioElements.value[index].play();
  }
};

// 點擊畫面任何地方都會收起音樂列表
const handleClickOutside = (event) => {
  if (
    isListVisible.value && // 確保音樂列表是開啟的
    listRef.value &&
    !listRef.value.contains(event.target) && // 點擊不在列表內
    buttonRef.value &&
    !buttonRef.value.contains(event.target) // 點擊不在按鈕上
  ) {
    isListVisible.value = false;
  }
};

// 監聽全局點擊事件
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.List {
  right: 30px;
  width: 100px;
}

.List ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 0;
}

.List button {
  padding: 10px;
  background-color: #e8e1dc;
  border: 0;
  cursor: pointer;
  text-align: center;
  border-radius: 8px;
  width: 80px;
}

.music_btn {
  right: 40px;
  top: 40px;
}
</style>
