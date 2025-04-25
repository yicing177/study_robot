// src/composables/useWebGazer.js
import { onMounted, ref } from 'vue'

export function useWebGazer(onGazeCallback, onLookAway, onLookBack) {
  const isLooking = ref(true)
  const gazeX = ref(null)
  const gazeY = ref(null)

  let lastTime = Date.now()

  onMounted(() => {
    const gaze = window.webgazer

    // 防呆處理
    if (
      !gaze ||
      typeof gaze.setGazeListener !== 'function' ||
      typeof gaze.begin !== 'function'
    ) {
      console.error('WebGazer 尚未正確載入或初始化不完全')
      return
    }

    gaze
      .setGazeListener((data, timestamp) => {
        if (data) {
          lastTime = Date.now()
          gazeX.value = data.x
          gazeY.value = data.y

          console.log('Gaze Data:', data)

          if (onGazeCallback) onGazeCallback(data, timestamp)

          if (!isLooking.value && onLookBack) {
            onLookBack()
            isLooking.value = true
          }
        }
      })
      .showVideo(true)
      .showFaceOverlay(true)
      .showPredictionPoints(true)
      .setTracker('TFFacemesh')
      .setRegression('ridge')
      .storePoints(true)

    // 多加一層保險：確保 begin 存在
    if (typeof gaze.begin === 'function') {
      gaze.begin()
    }
  })

  // 檢查是否太久沒看畫面
  setInterval(() => {
    const now = Date.now()
    if (now - lastTime > 5000 && isLooking.value) {
      isLooking.value = false
      if (onLookAway) onLookAway()
    }
  }, 1000)

  return {
    isLooking,
    gazeX,
    gazeY
  }
}
