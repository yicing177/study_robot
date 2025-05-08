<script setup>
import { useRoute } from "vue-router";
const route = useRoute();
import Function from "./components/function.vue";
import Music from "./components/music.vue";
import Return from "@/components/return.vue";
</script>

<template>
  <div class="button">
    <Function v-if="route.path !== '/login' && route.path !== '/register'"/>
    <Return v-if="route.path !== '/login' && route.path !== '/register' && route.path !== '/' && route.path !== '/file' "/>
    <Music v-if="route.path !== '/login' && route.path !== '/quiz' && route.path !== '/register' && route.path !== '/myBook' && route.path !== '/calendar'" />
  </div>
  <router-view :key="$route.fullPath" />
</template>

<style scoped>
</style>
