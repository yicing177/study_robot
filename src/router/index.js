import { createRouter, createWebHistory } from "vue-router";
import home from "../views/home.vue";
import register from "../views/register.vue";
import login from "../views/login.vue";
import calendar from "../views/calendar.vue";
import myBook from "../views/myBook.vue";
import summary from "../views/summary.vue";
import Robot from "@/components/robot.vue";

const routes = [
  { path: "/", component: home }, // 首頁
  { path: "/register", component: register }, // 註冊
  { path: "/login", component: login }, // 登入
  { path: "/calendar", component: calendar }, // 行事曆
  { path: "/myBook", component: myBook },
  { path: "/summary", component: summary },
];

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
});

export default router;
