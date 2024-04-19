import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Buffer } from "buffer";
import ElementPlus, { ID_INJECTION_KEY } from "element-plus";
import { createPinia } from "pinia";
import { setupLayouts } from "virtual:generated-layouts";
import generatedRoutes from "virtual:generated-pages";
import { ViteSSG } from "vite-ssg";
import { watch } from "vue";

library.add(fab, fas, far);

import App from "~/App.vue";
import { type UserModule } from "~/types";

import "normalize.css";
import "~/styles/element.scss";
import "~/styles/element-dark.scss";
import "~/styles/main.scss";

const routes = setupLayouts(generatedRoutes);

export const createApp = ViteSSG(App, { routes, base: import.meta.env.BASE_URL }, (ctx) => {
    Object.values(import.meta.glob<{ install: UserModule }>("./modules/*.ts", { eager: true })).forEach((module) =>
        module.install(ctx)
    );

    const pinia = createPinia();

    ctx.app.provide(ID_INJECTION_KEY, {
        prefix: Math.floor(Math.random() * 10000),
        current: 0,
    });

    ctx.app.use(pinia);
    ctx.app.use(ElementPlus);
    ctx.app.component("fa-icon", FontAwesomeIcon);

    if (ctx.isClient) {
        window.Buffer = Buffer;
        watch(
            pinia.state,
            (state) => {
                localStorage.setItem("user-state", Buffer.from(JSON.stringify(state.user)).toString("base64"));
            },
            { deep: true }
        );
    }
});
