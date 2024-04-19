import Vue from "@vitejs/plugin-vue";
// import VueJsx from "@vitejs/plugin-vue-jsx";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import Pages from "vite-plugin-pages";
import { VitePWA } from "vite-plugin-pwa";
import Inspector from "vite-plugin-vue-inspector";
import Layouts from "vite-plugin-vue-layouts";
import WebfontDownload from "vite-plugin-webfont-dl";
import generateSitemap from "vite-ssg-sitemap";

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            "@/": `${path.resolve(__dirname)}/`,
            "~/": `${path.resolve(__dirname, "src")}/`,
        },
    },
    plugins: [
        Vue({
            include: [/\.vue$/, /\.tsx$/, /\.md$/],
        }),
        // VueJsx(),
        Pages({
            extensions: ["vue", "tsx", "md"],
        }),
        Layouts(),
        AutoImport({
            imports: ["vue", "vue-router", "@vueuse/head", "@vueuse/core"],
            dts: "src/auto-imports.d.ts",
            dirs: ["src/composables", "src/stores"],
            vueTemplate: true,
        }),
        Components({
            extensions: ["vue", "tsx", "md"],
            include: [/\.vue$/, /\.vue\?vue/, /\.tsx$/, /\.md$/],
            dts: "src/components.d.ts",
        }),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "safari-pinned-tab.svg"],
            manifest: {
                name: "VueTemplate",
                short_name: "VueTemplate",
                theme_color: "#ffffff",
                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
        Inspect(),
        Inspector({
            toggleButtonVisibility: "never",
        }),
        WebfontDownload(),
    ],
    // @ts-expect-error ssgOptions not present in typings
    ssgOptions: {
        script: "async",
        formatting: "minify",
        // crittersOptions: {
        //     reduceInlineStyles: false,
        // },
        onFinished() {
            generateSitemap();
        },
    },
});
