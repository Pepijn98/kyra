import type { RouteProps } from "@solidjs/router";

export default function AuthLayout(props: RouteProps<string>) {
    return <>{props.children}</>;
}
