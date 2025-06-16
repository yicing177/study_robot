import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router';
import axios from 'axios'



const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = token;
}
axios.interceptors.response.use(//可以讓系統更穩健，如果 token 過期、失效，被踢回登入頁：
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      alert("請重新登入");
      localStorage.removeItem("token");
      
      window.location.href = "/login"; // 換成你的登入頁
    }
    return Promise.reject(err);
  }
);
const app = createApp(App);
app.use(router); // 啟用 Vue Router
app.mount('#app');


