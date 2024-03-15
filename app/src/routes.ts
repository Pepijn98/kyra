import { lazy } from "solid-js";
import type { RouteDefinition } from "@solidjs/router";

// reference https://github.com/solidjs/templates/blob/main/ts-router/src/routes.ts

import Home from "./pages/home";
import AuthLayout from "./pages/auth/layout";
import DashboardLayout from "./pages/dashboard/layout";

export const routes: RouteDefinition[] = [
    {
        path: "/",
        component: Home,
    },
    {
        path: "/auth",
        component: AuthLayout,
        children: [
            {
                path: "login",
                component: lazy(() => import("./pages/auth/login")),
            },
            {
                path: "register",
                component: lazy(() => import("./pages/auth/register")),
            },
        ],
    },
    {
        path: "/dashboard",
        component: DashboardLayout,
        children: [
            {
                path: "/:id/documents",
                component: lazy(() => import("./pages/dashboard/[id]/documents")),
            },
            {
                path: "/:id/images",
                component: lazy(() => import("./pages/dashboard/[id]/images")),
            },
            {
                path: "/:id/profile",
                component: lazy(() => import("./pages/dashboard/[id]/profile")),
            },
            {
                path: "/:id/settings",
                component: lazy(() => import("./pages/dashboard/[id]/settings")),
            },
        ],
    },
    {
        path: "**",
        component: lazy(() => import("./errors/404")),
    },
];
