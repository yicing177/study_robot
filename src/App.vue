<script setup>
import { useRoute } from "vue-router";
const route = useRoute(); 
import Function from "./components/function.vue";
import Music from "./components/music.vue";
</script>

<template>
  <div class="button">
    <Function v-if="route.path !== '/login'" />
    <Music v-if="route.path !== '/login'" />
    <router-view />
  </div>
</template>

<style scoped>

</style>
