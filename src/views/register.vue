<template>
    <div>
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <input v-model="email" type="email" placeholder="Enter email" required />
        <input v-model="password" type="password" placeholder="Enter password" required />
        <button type="submit">Register</button>
      </form>
      <button @click="goToLogin">Back</button>
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
          console.error("註冊失敗:", error.response?.data?.error || error.message);
          alert("註冊失敗：" + (error.response?.data?.error || error.message));
        }
      },
      async goToLogin(){
        this.$router.push("/login");
    }
    },
    
  };
  </script>
  