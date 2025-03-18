import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/home.vue";
import Login from "../views/login.vue";
import Robot from "@/components/robot.vue";

const routes = [
  { path: "/", component: Home }, // 首頁
  { path: "/login", component: Login }, // 登入
];

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes,
});

export default router;
