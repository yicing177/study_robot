import { createRouter, createWebHistory } from "vue-router";
import home from "../views/home.vue";
import register from "../views/register.vue";
import login from "../views/login.vue";
import calendar from "../views/calendar.vue";
import myBook from "../views/myBook.vue";
import quiz from "../views/quiz.vue";
import file from "../views/file.vue";
import ttsTest from "../views/ttsTest.vue";
import Robot from "@/components/robot.vue";
import chat_bottom from "@/components/chat_bottom.vue";

const routes = [
  { path: "/", name: "HomePage", 
    component: home ,
    meta: { requiresAuth: true },
  }, // 首頁 // ✅ 需要登入
  { path: "/register", component: register }, // 註冊
  { path: "/login", component: login }, // 登入
  { path: "/calendar",
     component: calendar,
     meta: { requiresAuth: true } }, // 行事曆
  { path: "/myBook", 
    component: myBook,
    meta: { requiresAuth: true } },
  { path: "/quiz", 
    component: quiz,
    meta: { requiresAuth: true } },
  { path: "/file", 
    component: file,
    meta: { requiresAuth: true }
   },
  { path: "/ttsTest", 
    component: ttsTest,
    meta: { requiresAuth: true }
  },
];


const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
});
// ✅ 全域前置守衛
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    // 沒有登入，跳回登入頁
    alert("請先登入");
    next('/login');
  } else {
    next(); // 繼續導航
  }
});


export default router;
