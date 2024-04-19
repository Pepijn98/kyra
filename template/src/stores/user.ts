import { isClient } from "@vueuse/core";
import { defineStore } from "pinia";

import { User } from "~/types/User";

type UserState = { user: User | null }

export const useUserStore = defineStore("user", {
    state: (): UserState => {
        if (isClient) {
            const userState = localStorage.getItem("user-state");
            if (userState) {
                return JSON.parse(Buffer.from(userState, "base64").toString("utf-8"));
            }
        }

        return {
            user: null
        };
    },
    getters: {
        isLoggedIn: (state) => state.user !== null,
    },
    actions: {
        addUser(user: User) {
            this.user = user;
        },
        removeUser() {
            this.user = null;
        }
    }
});
