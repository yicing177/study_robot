<template>
  <div class="robot">
    <canvas ref="liveCanvas" style="width: 100%"></canvas>
  </div>
  <!--
  <div class="btn_group">
    <button class="test-button" @click="Sing">唱歌</button>
    <button class="test-button" @click="Compliment">稱讚</button>
    <button class="test-button" @click="Encourage">打氣</button>
    <button class="test-button" @click="SayHi">打招呼</button>
  </div>
--></template>

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

let isInterrupted = false; // ✅ 控制 idle 播放
let idlePlaying = false; // ✅ 防止重複啟動 idle

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
  model = await Live2DModel.from(
    "../public/shizuku_t02/shizuku_t02.model3.json"
  );
  app.stage.addChild(model);

  // 設定 Live2D 模型
  model.scale.set(0.4);
  model.anchor.set(0.5, 0.5);
  model.position.set(app.renderer.width / 2, app.renderer.height / 2);

  window.addEventListener("resize", () => {
    model.scale.set(window.innerWidth / 2000);
    model.position.set(app.renderer.width / 2, app.renderer.height / 2);
  });

  // ✅ 啟動 idle 播放
  startIdleLoop();

  onBeforeUnmount(() => {
    model?.destroy();
    app?.destroy();
  });
});

// ✅ Idle 播放函式（插入）
async function startIdleLoop() {
  if (idlePlaying) return;
  idlePlaying = true;

  while (true) {
    if (!isInterrupted) {
      console.log("播放 idle TapBody[9]");
      await model.motion("TapBody", 9);
      await wait(500);
    } else {
      await wait(20);
    }
  }
}

// 通用動畫播放器（依序播放，含間隔）
async function playMotionGroup(indices, label) {
  isInterrupted = true;
  for (const i of indices) {
    console.log(`播放${label} 動畫 TapBody[${i}]`);
    model.motion("TapBody", i);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  isInterrupted = false;
}

async function playMotionGroupWithRepeat(before, repeatIndex, after, label) {
  if (!model) {
    console.warn("模型未初始化");
    return;
  }

  isInterrupted = true;

  // 開頭
  for (const i of before) {
    console.log(`播放 ${label} 開頭 TapBody[${i}]`);
    await model.motion("TapBody", i);
    await wait(1000);
  }

  // 中間重複
  const [repeatMotionIndex, repeatTimes] = repeatIndex;
  for (let i = 0; i < repeatTimes; i++) {
    console.log(`播放 ${label} 重複 ${i + 1} 次 TapBody[${repeatMotionIndex}]`);
    await model.motion("TapBody", repeatMotionIndex);
    await wait(500);
  }

  // 結尾
  for (const i of after) {
    console.log(`播放 ${label} 結尾 TapBody[${i}]`);
    await model.motion("TapBody", i);
    await wait(1000);
  }

  isInterrupted = false;
}

// 稱讚動作
function Compliment() {
  return playMotionGroup([18, 13, 15], "稱讚");
}

// 打氣動作
function Encourage() {
  return playMotionGroup([18, 14, 16], "打氣");
}

// 唱歌動作
function Sing() {
  return playMotionGroup([18, 17], "唱歌");
}

// 打招呼動作
function SayHi() {
  return playMotionGroup([10], "打招呼");
}

// 說話(揮手)to看人等指令 動作
function Speak_1_keep(repeatCount = 5) {
  return playMotionGroupWithRepeat([1, 5], [4, repeatCount], [6], "說話");
}

// 說話(揮手)to微笑回待機 動作
function Speak_1_end(repeatCount = 5) {
  return playMotionGroupWithRepeat([1, 5], [4, repeatCount], [7], "說話");
}

// 說話(無揮手)動作
function Speak_2(repeatCount = 5) {
  return playMotionGroupWithRepeat([18], [11, repeatCount], [12], "說話");
}

// 說話(無揮手)動作
function watch(repeatCount = 5) {
  return playMotionGroupWithRepeat([1], [2, repeatCount], [3], "注視");
}

// 等待工具
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
</script>

<style>
canvas {
  width: 100%;
  height: auto;
  display: block;
}

.robot {
  position: fixed;
  bottom: 0px;
  right: 0px;
  z-index: -1;
}
.btn_group {
  position: absolute;
  display: flex;
  flex-direction: row;
  top: 30%;
  right: 20%;
}
.test-button {
  transform: translateY(-50%);
  z-index: 100;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.test-button:hover {
  background-color: black;
}
</style>
