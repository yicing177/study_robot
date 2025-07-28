<template>
  <div class="robot">
    <canvas ref="liveCanvas" width="100%"></canvas>
  </div>
</template>

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
let idleShouldStop = false;

onMounted(async () => {
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
  await startIdleLoop();

  onBeforeUnmount(() => {
    model?.destroy();
    app?.destroy();
  });
});

function playMotionAndWait(index) {
  return new Promise((resolve, reject) => {
    if (!model) {
      console.warn("⚠️ Live2D 模型尚未初始化完成");
      return reject("model not ready");
    }

    console.log(`🎬 開始播放 TapBody[${index}]`);
    
    // 設定超時機制，避免永遠等待
    const timeout = setTimeout(() => {
      console.warn(`⚠️ TapBody[${index}] 播放超時，強制結束`);
      resolve(); // 即使超時也要 resolve，避免卡住
    }, 5000); // 5秒超時

    try {
      const result = model.motion("TapBody", index, {
        onFinished: () => {
          console.log(`✅ TapBody[${index}] 播放完成`);
          clearTimeout(timeout); // 清除超時
          resolve();
        },
        onError: (error) => {
          console.error(`❌ TapBody[${index}] 播放出錯:`, error);
          clearTimeout(timeout);
          resolve(); // 即使出錯也要 resolve，避免卡住
        }
      });
      
      // 檢查 motion 方法是否正確返回
      console.log(`🔍 motion 方法返回值:`, result);
      
      // 如果 motion 方法沒有返回值或返回 false，可能表示動畫不存在
      if (result === false || result === null) {
        console.warn(`⚠️ TapBody[${index}] 可能不存在或無法播放`);
        clearTimeout(timeout);
        resolve();
      }
      
    } catch (error) {
      console.error(`❌ 調用 motion 方法出錯:`, error);
      clearTimeout(timeout);
      resolve(); // 出錯也要 resolve
    }
  });
}

function stopIdleLoop() {
  idleShouldStop = true;
}

// ✅ Idle 播放函式（插入）
async function startIdleLoop() {
  console.log("🎬 開始 startIdleLoop");
  
  // 如果已經在播放中，直接返回
  if (idlePlaying) {
    console.log("⚠️ Idle 已在播放中，跳過");
    return;
  }
  
  // 重置狀態
  idleShouldStop = false;
  idlePlaying = true;
  
  try {
    while (!idleShouldStop) { // ✅ 修正：檢查停止條件
      if (!isInterrupted) {
        console.log("播放 idle TapBody[9]");
        await model.motion("TapBody", 9);
        await wait(500);
      } else {
        await wait(20);
      }
    }
  } catch (error) {
    console.error("Idle 播放出錯:", error);
  } finally {
    // ✅ 確保狀態重置
    idlePlaying = false;
    console.log("🛑 Idle 播放結束");
  }
}

// 通用動畫播放器（依序播放，含間隔）
async function playMotionGroup(indices, label) {
  console.log(`🎬 開始播放 ${label} 動畫組`);
  
  // 停止 idle 並等待它真正停止
  stopIdleLoop();
  isInterrupted = true;
  
  // 等待 idle 真正停止
  let waitCount = 0;
  while (idlePlaying && waitCount < 50) { // 最多等待 1 秒
    await wait(20);
    waitCount++;
  }
  
  try {
    for (const i of indices) {
      console.log(`🎬 播放 ${label} 動畫 TapBody[${i}]`);
      await playMotionAndWait(i);
      await wait(200);
    }
  } catch (error) {
    console.error(`${label} 動畫播放出錯:`, error);
  } finally {
    isInterrupted = false;
    console.log(`✅ ${label} 動畫組播放完成`);
  }
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

defineExpose({
  SayHi,
  startIdleLoop, // ✅ 加這行
  stopIdleLoop, // ✅ 也暴露出來給外面可叫用
});
</script>

<style>
canvas {
  width: 100%;
  height: auto;
  display: block;
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
