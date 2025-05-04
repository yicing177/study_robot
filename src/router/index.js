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
  { path: "/", component: home }, // 首頁
  { path: "/register", component: register }, // 註冊
  { path: "/login", component: login }, // 登入
  { path: "/calendar", component: calendar }, // 行事曆
  { path: "/myBook", component: myBook },
  { path: "/quiz", component: quiz },
  { path: "/file", component: file },
  { path: "/ttsTest", component: ttsTest},
];

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
});

export default router;
