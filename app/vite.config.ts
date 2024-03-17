import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    server: {
        open: true,
        port: 3000,
        hmr: true,
        watch: {
            usePolling: true,
        },
    },
});
