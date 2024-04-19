<template>
    <div class="sidenav-action">
        <el-button class="sidenav-button" :type="active ? 'primary' : ''" :plain="active">
            <fa-icon v-if="hasIcon" :style="{ 'margin-right': '10px' }" :icon="icon"/>
            <slot />
        </el-button>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    icon: Array as PropType<string[]>,
    active: {
        type: Boolean,
        default: false
    }
});

const hasIcon = computed(() => props.icon !== undefined && props.icon.length >= 2);
</script>

<style lang="scss" scoped>
.sidenav-action {
    height: 88px;
    width: 100%;
    display: flex;
    justify-content: center;

    .sidenav-button {
        height: inherit;
        width: 200px;
        border-radius: 50px;
        font-size: 20px;
    }
}
</style>
