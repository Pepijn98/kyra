import { type RouteProps, useParams, A } from "@solidjs/router";

export default function DashboardLayout(props: RouteProps<string>) {
    const params = useParams();

    return (
        <>
            <nav>
                <ol class="list-none">
                    <li>
                        <A href={`/dashboard/${params.id}/documents`}>Documents</A>
                    </li>
                    <li>
                        <A href={`/dashboard/${params.id}/images`}>Images</A>
                    </li>
                    <li>
                        <A href={`/dashboard/${params.id}/profile`}>Profile</A>
                    </li>
                    <li>
                        <A href={`/dashboard/${params.id}/settings`}>Settings</A>
                    </li>
                </ol>
            </nav>
            {props.children}
        </>
    );
}
