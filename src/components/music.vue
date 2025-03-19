<template>
  <button @click="toggleMusicList" class="music_btn">
    <img src="../assets/logo/music.svg" width="80" height="80" />
  </button>

  <!-- 使用 v-show 來顯示/隱藏功能列 -->
  <div v-show="isListVisible" class="List">
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
import { ref } from "vue";

// 控制音樂選單顯示與否
const isListVisible = ref(false);
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
    // 先暫停所有音樂
    audioElements.value.forEach((audio) => audio.pause());
    // 重置當前音樂進度並播放
    audioElements.value[index].currentTime = 0;
    audioElements.value[index].play();
  }
};
</script>

<style scoped>
.List {
  right: 30px;
  width: 100px;
}
.List ul{
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 0; /* 移除 ul 預設內邊距 */
  margin: 10; 
}
.List button {
  padding: 10px;
  background-color: rgb(199, 138, 159);
  border: 0px;
  cursor: pointer;
  text-align: center;
  border-radius: 8px;
  width: 80px;
}
</style>
