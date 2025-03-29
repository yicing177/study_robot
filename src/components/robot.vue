<script setup>
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";
import { onMounted, onBeforeUnmount, ref } from "vue";
import { testApi } from "@/api";

// PIXI 設定
window.PIXI = PIXI;
const liveCanvas = ref(null);
let app;
let model;

// Vue `onMounted` 鉤子
onMounted(async () => {
  // 測試 Flask API
  const data = await testApi();
  if (data) {
    console.log("Vue 成功接收到後端回應:", data);
  } else {
    console.log("Vue 與 Flask API 連線失敗");
  }

  // PIXI 應用初始化
  app = new PIXI.Application({
    view: liveCanvas.value,
    autoStart: true,
    resizeTo: window,
    backgroundAlpha: 0,
  });

  // 載入 Live2D 模型
  model = await Live2DModel.from("../public/shizuku/shizuku.model3.json");
  app.stage.addChild(model);

  // 設定 Live2D 模型
  model.scale.set(0.4);
  model.anchor.set(0.5, 0.5);
  model.position.set(app.renderer.width / 2, app.renderer.height / 2);

  window.addEventListener("resize", () => {
    model.scale.set(window.innerWidth / 2000);
    model.position.set(app.renderer.width / 2, app.renderer.height / 2);
  });

  // 設定動畫
  const motion05 = "yyx05.motion3.json";
  const motion06 = "yyx06.motion3.json";
  let playCount = 0;

  // 播放指定的動畫
  function playNextIdleMotion() {
    if (playCount < 3) {
      console.log(`正在播放: ${motion05} (第 ${playCount + 1} 次)`);
      model.motion("Flick3", 0); // 播放第 0 個動作
      playCount++;
    } else {
      console.log(`正在播放: ${motion06}`);
      model.motion("Flick3", 1); // 播放第 1 個動作
      playCount = 0; // 重置計數器
    }
  }

  // 計時器
  let playInterval;

  function startMotionLoop() {
    playInterval = setInterval(() => {
      playNextIdleMotion();
    }, 5050);
  }

  function stopMotionLoop() {
    clearInterval(playInterval);
  }

  startMotionLoop();

  onBeforeUnmount(() => {
    stopMotionLoop();
    model?.destroy();
    app?.destroy();
  });
});
</script>

<template>
  <div class="robot">
    <canvas ref="liveCanvas" width="100%"></canvas>
  </div>
</template>

<style>
canvas {
  width: 100%; /* 让 canvas 填满 robot */
  height: auto;
  display: block;
}
</style>
