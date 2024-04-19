<template>
    <div>
        <h1>Index</h1>
    </div>
</template>

<script setup lang="ts">
const router = useRouter();

// TODO: Create landing page
router.push("/dashboard/login");
</script>

<style lang="scss" scoped>
</style>

<route lang="yaml">
meta:
  title: Home
  layout: default
</route>
