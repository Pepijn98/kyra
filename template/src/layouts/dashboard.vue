<template>
    <el-container>
        <el-header v-if="isMobile"></el-header>
        <el-container>
            <el-aside v-if="!isMobile" width="360px">
                <SideNav />
            </el-aside>
            <el-main>
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsSematic } from "@vueuse/core";

import SideNav from "~/components/SideNav.vue";

const breakpoints = useBreakpoints(breakpointsSematic);
const isMobile = breakpoints.smallerOrEqual("mobileL");
</script>

<style lang="scss" scoped>

</style>
