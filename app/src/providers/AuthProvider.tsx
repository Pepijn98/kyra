import { RouteProps } from "@solidjs/router";
import { createContext, useContext } from "solid-js";

type AuthUser = {
    name: string;
    email: string;
    token: string;
};

type Auth = {
    is_authenticated: boolean;
    user?: AuthUser;
};

export const AuthContext = createContext<Auth>();

export const AuthProvider = (props: RouteProps<string>) => {
    const user_str = localStorage.getItem("user");

    if (!user_str) {
        return <AuthContext.Provider value={{ is_authenticated: false }}>{props.children}</AuthContext.Provider>;
    }

    const user = JSON.parse(user_str) as AuthUser;

    const auth: Auth = {
        is_authenticated: false,
        user,
    };

    return <AuthContext.Provider value={auth}>{props.children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
