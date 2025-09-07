<template>
  <!-- 音樂按鈕 -->
  <button @click="toggleMusicList" class="music_btn" ref="buttonRef" :title="currentBgmTitle ? `正在播放：${currentBgmTitle}` : '打開音樂清單'">
    <img src="../assets/logo/music.svg" width="80" height="80" />
  </button>

  <!-- 音樂選單 -->
  <div v-show="isListVisible" class="List" ref="listRef">
    <ul>
      <button
        v-for="(music, index) in musicList"
        :key="index"
        @click="playBgm(index)"
      >
        {{ music.name }} <span v-if="currentBgmTitle === music.name">(播放中)</span>
      </button>
      <button @click="stopBgm" :disabled="!isBgmPlaying">停止播放</button>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { audioManager } from "@/composables/audioManager.js"; // ✅ 全域音頻管理器

// 控制音樂選單顯示與否
const isListVisible = ref(false);
const buttonRef = ref(null);
const listRef = ref(null);

// 目前曲目與狀態（僅做顯示）
const currentBgmTitle = ref(null);
const isBgmPlaying = ref(false);

const toggleMusicList = () => {
  isListVisible.value = !isListVisible.value;
};

// 音樂清單
const musicList = ref([
  { name: "鋼琴伴奏" },
  { name: "細雨綿綿" },
  { name: "輕快輕鬆" },
  { name: "爵士抒情" },
  { name: "海浪輕擊" },
  { name: "鳥兒啾鳴" },
]);

// 播放對應的音樂（統一交給 audioManager 的 bgm channel）
const playBgm = async (index) => {
  try {
    const title = musicList.value[index].name;
    const res = await axios.get(`http://localhost:5000/music/${encodeURIComponent(title)}`);
    const { url } = res.data;

    await audioManager.play({
      channel: "bgm",
      src: url,
      loop: true,
      duckOthers: false,  // BGM 不主動壓別人；TTS 播放時會自動 duck
      fadeInMs: 200,
      onStart: () => {
        currentBgmTitle.value = title;
        isBgmPlaying.value = true;
      },
      onEnd: () => {
        // 一般 bgm 會 loop，不太會觸發 onEnd；保留以防之後改設定
        isBgmPlaying.value = false;
        currentBgmTitle.value = null;
      },
    });

    // 點完曲目就收起列表（可依需保留）
    isListVisible.value = false;
  } catch (err) {
    console.error("播放失敗:", err);
    alert("找不到這首歌請確認名稱");
  }
};

const stopBgm = () => {
  audioManager.stop("bgm");
  isBgmPlaying.value = false;
  currentBgmTitle.value = null;
};

// 點擊畫面任何地方都會收起音樂列表
const handleClickOutside = (event) => {
  if (
    isListVisible.value &&
    listRef.value && !listRef.value.contains(event.target) &&
    buttonRef.value && !buttonRef.value.contains(event.target)
  ) {
    isListVisible.value = false;
  }
};

// 監聽全局點擊事件
onMounted(() => {
  document.addEventListener("click", handleClickOutside);

  // 若需要從 manager 端反向更新狀態（例如外部 stop）
  const bgmEl = () => audioManager.channels.bgm?.audio;
  const attachListeners = () => {
    const el = bgmEl();
    if (!el) return;
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
  };
  const detachListeners = () => {
    const el = bgmEl();
    if (!el) return;
    el.removeEventListener("play", onPlay);
    el.removeEventListener("pause", onPause);
    el.removeEventListener("ended", onEnded);
  };

  function onPlay() { isBgmPlaying.value = true; }
  function onPause() { isBgmPlaying.value = false; }
  function onEnded() { isBgmPlaying.value = false; currentBgmTitle.value = null; }

  // 嘗試立即綁定，若首次尚未建立 audio 實體，也無妨
  attachListeners();

  // 可選：路由切換時是否保留 BGM？
  // 如果你的 UX 想跨頁持續播放，就不要在 unmounted 停 bgm
  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
    // audioManager.stop("bgm"); // 想離頁就停，則打開這行
    detachListeners();
  });
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
.List button:hover {
  background-color: #e8e1dca2;
}

.music_btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: transparent;
  border: none;
  padding: 0;
  position: absolute; /* 如果你是絕對定位用 left/top */
  right: 40px;
  top: 40px;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
  display: flex; /* 確保裡面的 img 水平垂直置中 */
  align-items: center;
  justify-content: center;
}
.music_btn:hover {
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.3); /* 懸停時增加陰影 */
}
</style>
