// src/composables/useWebGazer.js
import { onMounted, onBeforeUnmount, ref } from 'vue'

export function useWebGazer(onGazeCallback, onLookAway, onLookBack) {
  const isLooking = ref(false)
  const gazeX = ref(null)
  const gazeY = ref(null)

  // ---- 可調參數（建議先用預設） ----
  const WINDOW_MS = 1200        // 統計視窗: 近 1.2 秒
  const MIN_BACK_MS = 800       // 連續「看著」至少 0.4 秒才判定回來
  const MIN_AWAY_MS = 800       // 連續「沒看」至少 0.8 秒才判定離開
  const INSIDE_RATIO_ON = 0.6   // 在視窗內比例 >= 60% 才算「看著」（回來門檻）
  const INSIDE_RATIO_OFF = 0.4  // 在視窗內比例 < 40% 才算「沒看」（離開門檻）
  const MARGIN = 60             // 給螢幕邊緣寬鬆 60px 的緩衝
  const DATA_STALE_MS = 800     // 800ms 完全沒資料，直接視為「沒看」
  const TICK_MS = 80            // 每 80ms 檢查一次狀態

  // ---- 狀態緩衝區 ----
  let buffer = [] // [{t, x, y, inside}]
  let lastDataAt = 0
  let lastBecameLookingAt = 0
  let lastBecameAwayAt = Date.now()
  let timer = null

  function pushPoint(x, y) {
    const t = Date.now()
    const w = window.innerWidth
    const h = window.innerHeight

    // 判斷是否在視窗(含緩衝)內
    const inside =
      x != null && y != null &&
      x >= -MARGIN && x <= w + MARGIN &&
      y >= -MARGIN && y <= h + MARGIN

    buffer.push({ t, x, y, inside })
    lastDataAt = t
    gazeX.value = x
    gazeY.value = y

    // 滑動視窗：移除超時的點
    const cutoff = t - WINDOW_MS
    while (buffer.length && buffer[0].t < cutoff) buffer.shift()
  }

  function computeInsideRatio() {
    if (!buffer.length) return 0
    const insideCount = buffer.reduce((acc, p) => acc + (p.inside ? 1 : 0), 0)
    return insideCount / buffer.length
  }

  function checkState() {
    const now = Date.now()

    // 1) 資料連續性：完全沒資料太久，直接視為不在看
    if (now - lastDataAt > DATA_STALE_MS) {
      if (isLooking.value) {
        // 變成沒看：需滿足最短離開時間（慣性）
        if (now - lastBecameAwayAt >= MIN_AWAY_MS) {
          isLooking.value = false
          if (onLookAway) onLookAway()
        }
      } else {
        // 持續沒看
        lastBecameAwayAt = now
      }
      return
    }

    // 2) 位置比例：用滑動視窗比例判斷
    const ratio = computeInsideRatio()

    if (!isLooking.value) {
      // 從「沒看」→「看著」的回來判斷（使用較高門檻）
      if (ratio >= INSIDE_RATIO_ON) {
        if (lastBecameLookingAt === 0) lastBecameLookingAt = now
        if (now - lastBecameLookingAt >= MIN_BACK_MS) {
          isLooking.value = true
          lastBecameAwayAt = 0
          if (onLookBack) onLookBack()
        }
      } else {
        // 沒達門檻就重置計時
        lastBecameLookingAt = 0
        lastBecameAwayAt = now
      }
    } else {
      // 從「看著」→「沒看」的離開判斷（使用較低門檻）
      if (ratio < INSIDE_RATIO_OFF) {
        if (lastBecameAwayAt === 0) lastBecameAwayAt = now
        if (now - lastBecameAwayAt >= MIN_AWAY_MS) {
          isLooking.value = false
          lastBecameLookingAt = 0
          if (onLookAway) onLookAway()
        }
      } else {
        // 還在看就持續刷新回來時間
        lastBecameLookingAt = now
        lastBecameAwayAt = 0
      }
    }
  }

  onMounted(() => {
    const gaze = window.webgazer
    if (!gaze || typeof gaze.setGazeListener !== 'function' || typeof gaze.begin !== 'function') {
      console.error('WebGazer 尚未正確載入或初始化不完全')
      return
    }

    gaze
      .setGazeListener((data, timestamp) => {
        if (!data) return
        // 記錄點位到緩衝區
        pushPoint(data.x, data.y)
        if (onGazeCallback) onGazeCallback(data, timestamp)
      })
      .showVideo(true)
      .showFaceOverlay(true)
      .showPredictionPoints(true)
      .setTracker('TFFacemesh')
      .setRegression('ridge')
      .storePoints(true)

    gaze.begin()

    // 啟動狀態檢查計時器
    timer = setInterval(checkState, TICK_MS)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return {
    isLooking,
    gazeX,
    gazeY
  }
}
