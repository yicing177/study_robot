<template>
  <div class="register_container">
    <form class="register_box" @submit.prevent="handleRegister">
      <h1 class="title">REGISTER</h1>
      <div class="email_box">
        <input
          v-model="email"
          type="email"
          name="email"
          placeholder="EMAIL"
          id="email"
          required
        />
      </div>
      <div class="pwd_box">
        <input
          v-model="password"
          type="password"
          name="password"
          placeholder="PASSWORD"
          id="password"
          required
        />
      </div>
      <div class="button">
        <button class="btn_return" @click="goToLogin">Back</button>
        <button class="btn_signUp" type="submit">Sign Up</button>
      </div>
    </form>
  </div>
</template>

<script>
import { register } from "@/api.js";

export default {
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async handleRegister() {
      if (!this.email || !this.password) {
        alert(" Email 與密碼不得為空");
        return;
      }

      try {
        console.log("發送註冊請求:", this.email, this.password);
        const response = await register(this.email, this.password);

        console.log("註冊成功:", response);
        alert("註冊成功！");
        this.$router.push("/login");
      } catch (error) {
        console.error(
          "註冊失敗:",
          error.response?.data?.error || error.message
        );
        alert("註冊失敗：" + (error.response?.data?.error || error.message));
      }
    },
    async goToLogin() {
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.register_container {
  display: flex;
  justify-content: center;
  align-items: center; /* 垂直置中 */
  min-height: 100vh;
  width: 100vw;
}
.register_box {
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: #c9b8ac;
  padding: 40px 50px;
  border-radius: 20px;
  gap: 25px;
  width: 30%;
}
.title {
  margin: 0;
}
.email_box,
.pwd_box {
  width: 100%; /* 確保父容器占滿 login_box */
  display: flex;
  justify-content: center; /* 讓內部的 input 水平置中 */
}
#email,
#password {
  padding: 10px 20px;
  border-radius: 20px;
  border: 0;
  width: 90%;
  background-color: #e8e1dc;
}
.button {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10%;
  width: 90%;
}
.btn_return,
.btn_signUp {
  border: 0;
  border-radius: 20px;
  padding: 10px 20px;
  background-color: #e8e1dc;
}
</style>
