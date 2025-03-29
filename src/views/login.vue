<template>
  <div class="login_container">
    <div class="login_box">
      <h1 class="title">LOGIN</h1>
      <div class="email_box">
        <input
          type="text"
          name="email"
          placeholder="EMAIL"
          id="email"
          required
        />
      </div>
      <div class="pwd_box">
        <input
          type="password"
          name="password"
          placeholder="PASSWORD"
          id="password"
          required
        />
      </div>
      <div>
        <button class="btn_forget_pwd">Forget password</button>
      </div>
      <div>
        <button class="btn_login" @click="navigateTo('/')">Login in</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.login_container {
  display: flex;
  justify-content: center;
  align-items: center; /* 垂直置中 */
  min-height: 100vh;
  width: 100vw;
}
.login_box{
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: #c9b8ac;
  padding: 40px 50px;
  border-radius: 20px;
  gap: 25px;
  width: 30%;
}
.title{
  margin: 0;
}
.email_box,
.pwd_box {
  width: 100%; /* 確保父容器占滿 login_box */
  display: flex;
  justify-content: center; /* 讓內部的 input 水平置中 */
}
#email,
#password{
  padding: 10px 20px;
  border-radius: 20px;
  border: 0;
  width: 90%;
  background-color: #e8e1dc;
}
.btn_forget_pwd{
  border: 0;
  background-color: transparent;
}
.btn_login{
  border: 0;
  border-radius: 20px;
  padding: 10px 20px;
  background-color: #e8e1dc;

}
</style>
