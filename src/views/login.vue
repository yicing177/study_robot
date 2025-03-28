<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Enter email" required />
      <input v-model="password" type="password" placeholder="Enter password" required />
      <button type="submit">Login</button>
    </form>
    <p>還沒有帳號請先註冊</p>
    <button @click="goToRegister">Create</button>
  </div>
</template>

<script>
import { auth, db } from "@/firebase/firebase"; // 引入 Firebase 認證與 Firestore
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore 函式

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
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        console.log("登入成功:", userCredential.user);
    
        // 存入 localStorage
        localStorage.setItem("token", userCredential.user.accessToken);
        localStorage.setItem("uid", userCredential.user.uid);

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
    goToRegister() {
      this.$router.push("/register");
    },
  },
};
</script>
