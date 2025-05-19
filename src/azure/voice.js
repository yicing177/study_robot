import axios from 'axios'

const postSTT = async () => {
  try {
    const response = await axios.post('http://localhost:5000/routes/stt', {
      filename: 'test_audio_chi.wav'  // 替換成你實際音檔
    })

    console.log('語音辨識成功：', response.data.transcript)
  } catch (error) {
    console.error('STT 失敗：', error.response?.data || error.message)
  }
}

const postTTS = async () => {
  try {
    const response = await axios.post('http://localhost:5000/routes/tts', {
      filename: 'test_text.json'  // 替換成你實際的 JSON 檔名
    })

    const audioFile = response.data.file
    console.log('語音合成成功：', audioFile)

    // 選擇性：自動播放
    const audio = new Audio(`http://localhost:5000/dir_tts_result/${audioFile}`)
    audio.play()

  } catch (error) {
    console.error('TTS 失敗：', error.response?.data || error.message)
  }
}

export { postSTT, postTTS }
