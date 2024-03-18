import { RouteProps } from "@solidjs/router";
import { createContext, useContext } from "solid-js";

type AuthUser = {
    name: string;
    email: string;
    token: string;
};

type Auth = {
    isAuthenticated: boolean;
    user?: AuthUser;
};

export const AuthContext = createContext<Auth>();

export const AuthProvider = (props: RouteProps<string>) => {
    const user_str = localStorage.getItem("user");

    if (!user_str) {
        return <AuthContext.Provider value={{ isAuthenticated: false }}>{props.children}</AuthContext.Provider>;
    }

    const user = JSON.parse(user_str) as AuthUser;

    const auth: Auth = {
        isAuthenticated: false,
        user,
    };

    return <AuthContext.Provider value={auth}>{props.children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
