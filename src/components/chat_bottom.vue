<template>
  <div class="chat_container">
    <div class="chat_box">
      <div class="upload_btn">
        <img src="../assets/logo/upload.svg" width="40" height="40" />
      </div>
      <input placeholder="輸入您的問題..." id="box" />
      <div class="voice_btn">
        <img src="../assets/logo/voice.svg" width="40" height="40" />
      </div>
      <div class="send_btn">
        <img src="../assets/logo/send.svg" width="40" height="40" />
      </div>
    </div>
  </div>
</template>

<style scoped>
#box {
  width: 90%;
  border-radius: 10px;
  border: 0px;
  padding: 10px;
}
.chat_container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chat_box {
  position: absolute;
  width: 90%;
  bottom: 25px;
  border-radius: 10px; /* 圓角 */
  background-color: #c9b8ac; /* 背景色 */
  padding: 15px 20px; /* 依序為上下、左右 */
  overflow-y: auto; /* 內容超出時可以滾動 */
  display: flex;
  flex-direction: row;
  gap: 10px;
  
}
.voice_btn,
.upload_btn,
.send_btn {
  display: flex;
  justify-content: center;
}
</style>
