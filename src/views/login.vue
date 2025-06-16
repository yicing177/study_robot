<template>
  <div class="login_container">
    <form class="login_box" @submit.prevent="handleLogin">
      <h1 class="title">LOGIN</h1>
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
      <div>
        <button class="btn_forget_pwd" @click="handleResetPassword">
          Forget password
        </button>
      </div>
      <div class="button">
        <button class="btn_singUp" @click="goToRegister">Sign Up</button>
        <button class="btn_login" type="submit">Login in</button>
      </div>
    </form>
  </div>
</template>

<script>
//邱
import { auth, db } from "@/firebase/firebase"; // 引入 Firebase 認證與 Firestore
import { signInWithEmailAndPassword } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore 函式
import axios from "axios";

export default {
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async handleLogin() {
      try {
        // 使用 Firebase Auth 進行登入
        const userCredential = await signInWithEmailAndPassword(
          auth,
          this.email,
          this.password
        );
        console.log("登入成功:", userCredential.user);

        // 存入 localStorage
        localStorage.setItem("uid", userCredential.user.uid);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = token;
        console.log("登入資訊：", userCredential);
        console.log("目前 token：", localStorage.getItem("token"));

        window.location.href = "/"; // ✅ 強制刷新頁面，讓 token 生效

        // 儲存登入資訊到 Firestore
        const userData = {
          email: this.email,
          loginTime: new Date().toISOString(),
        };
        const userRef = doc(db, "users", userCredential.user.uid); // 假設集合名稱為 `users`
        await setDoc(userRef, userData, { merge: true });

        // 導向到主頁
        this.$router.push("/");
      } catch (error) {
        console.error("登入失敗:", error.message);
        alert("登入失敗：" + error.message); // 顯示錯誤訊息
      }
    },
    async handleResetPassword() {
      if (!this.email) {
        alert("請先輸入email再按忘記密碼");
        return;
      }
      try {
        await sendPasswordResetEmail(auth, this.email);
        alert("重設密碼郵件已送，請查收信箱!");
      } catch (error) {
        console.error("寄送失敗:", error.message);
        alert("無法寄送密碼重設信");
      }
    },
    goToRegister() {
      this.$router.push("/register");
    },
  },
};
</script>

<script setup>
//呂
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
.login_box {
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
.btn_forget_pwd {
  border: 0;
  background-color: transparent;
}
.btn_forget_pwd:hover{
  background-color: #e8e1dc65;
  border-radius: 5px;
}
.button {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10%;
  width: 90%;
}
.btn_login,
.btn_singUp {
  border: 0;
  border-radius: 20px;
  padding: 10px 20px;
  background-color: #e8e1dc;
}
.btn_login:hover,
.btn_singUp:hover {
  background-color: #e8e1dc90;
}
</style>
