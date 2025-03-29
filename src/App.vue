<script setup>
import { useRoute } from "vue-router";
const route = useRoute();
import Function from "./components/function.vue";
import Music from "./components/music.vue";
</script>

<template>
  <div class="button">
    <Function v-if="route.path !== '/login' && route.path !== '/register'"/>
    <Music v-if="route.path !== '/login' && route.path !== '/quiz' && route.path !== '/register'" />
  </div>
  <router-view />
</template>

<style scoped></style>
