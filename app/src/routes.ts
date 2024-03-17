import { lazy } from "solid-js";
import type { RouteDefinition } from "@solidjs/router";

// reference https://github.com/solidjs/templates/blob/main/ts-router/src/routes.ts

import Home from "./pages/home";
import AuthLayout from "./layouts/auth";
import DashboardLayout from "./layouts/dashboard";

import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import Documents from "./pages/dashboard/[id]/documents";
import Images from "./pages/dashboard/[id]/images";
import Profile from "./pages/dashboard/[id]/profile";
import Settings from "./pages/dashboard/[id]/settings";

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
                component: Login,
            },
            {
                path: "register",
                component: Register,
            },
        ],
    },
    {
        path: "/dashboard",
        component: DashboardLayout,
        children: [
            {
                path: "/:id/documents",
                component: Documents,
            },
            {
                path: "/:id/images",
                component: Images,
            },
            {
                path: "/:id/profile",
                component: Profile,
            },
            {
                path: "/:id/settings",
                component: Settings,
            },
        ],
    },
    {
        path: "**",
        component: lazy(() => import("./errors/404")),
    },
];
