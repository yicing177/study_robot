<template>
  <button class="return_btn" @click="navigateTo('/')">
    <img src="../assets/logo/return.svg" />
  </button>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const navigateTo = (path) => {
  router.push(path);
};
</script>

<style>
.return_btn {
  left: 40px;
  bottom: 40px;
}
</style>
