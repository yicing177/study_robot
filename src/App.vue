<script>
//以下需要引入：
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";
window.PIXI = PIXI; // 为了pixi-live2d-display内部调用
let app; // 为了存储pixi实例
let model; // 为了存储live2d实例

export default {
  //需要引入：
  async mounted() {
    app = new PIXI.Application({
      view: this.$refs.liveCanvas,
      autoStart: true,
      resizeTo: window,
      backgroundAlpha: 0,
    });

    model = await Live2DModel.from("../public/shizuku/shizuku.model3.json");
    app.stage.addChild(model);

    // 設定縮放 & 錨點
    model.scale.set(0.4); // 初始縮放
    model.anchor.set(0.5, 0.5); // 讓模型以自身中心點縮放
    model.position.set(app.renderer.width / 2, app.renderer.height / 2); // 置中

    // 監聽視窗變化
    window.addEventListener("resize", () => {
      model.scale.set(window.innerWidth / 2000); // 動態調整大小
      model.position.set(app.renderer.width / 2, app.renderer.height / 2);
    });
  },

  //需要引入
  beforeUnmount() {
    model?.destroy();
    app?.destroy();
  },
};
</script>
<template>
  <div class="app">
    <!-- 自定义ref="liveCanvas"： -->
    <canvas ref="liveCanvas"></canvas>
  </div>
</template>

<style scoped>
.app {
  background-color: #f1d5ae;
}
header {
  line-height: 1.5;
}
</style>
