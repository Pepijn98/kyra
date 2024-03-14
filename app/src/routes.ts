import { lazy } from "solid-js";
import type { RouteDefinition } from "@solidjs/router";

// reference https://github.com/solidjs/templates/blob/main/ts-router/src/routes.ts

import Home from "./pages/home";

export const routes: RouteDefinition[] = [
    {
        path: "/",
        component: Home,
    },
    {
        path: "**",
        component: lazy(() => import("./errors/404")),
    },
];
