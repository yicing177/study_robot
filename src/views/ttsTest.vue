<template>
    <div>
      <h2>語音轉文字 STT</h2>
      <button @click="runSTT">執行語音辨識</button>
      <p>辨識結果：{{ transcript }}</p>
  
      <h2>文字轉語音 TTS</h2>
      <button @click="runTTS">執行語音合成</button>
      <audio v-if="ttsFile" :src="`http://localhost:5000/dir_tts_result/${ttsFile}`" controls />
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import axios from 'axios'
  
  const transcript = ref('')
  const ttsFile = ref('')
  
  const runSTT = async () => {
    try {
      const res = await axios.post('http://localhost:5000/routes/stt', {
        filename: 'test_audio_chieng.wav' // 替換成你的檔名
      })
      transcript.value = res.data.transcript
      console.log('STT 成功：', res.data.transcript)
    } catch (error) {
      console.error('STT 失敗：', error.response?.data || error.message)
    }
  }
  
  const runTTS = async () => {
    try {
      const res = await axios.post('http://localhost:5000/routes/tts', {
        filename: 'test_text.json' // 替換成你的檔名
      })
      ttsFile.value = res.data.file
      console.log('TTS 成功：', res.data.file)
  
      // 自動播放一次
      const audio = new Audio(`http://localhost:5000/dir_tts_result/${res.data.file}`)
      audio.play()
    } catch (error) {
      console.error('TTS 失敗：', error.response?.data || error.message)
    }
  }
  </script>
  