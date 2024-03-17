import { type RouteProps, useParams, A } from "@solidjs/router";

export default function DashboardLayout(props: RouteProps<string>) {
    const params = useParams();

    return (
        <>
            <aside
                id="separator-sidebar"
                class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
                aria-label="Sidebar"
            >
                <div class="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <ol class="space-y-2 font-medium">
                        <li>
                            <A
                                href={`/dashboard/${params.id}/profile`}
                                class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                                activeClass="bg-gray-100 dark:bg-gray-700 dark:text-white"
                            >
                                <span class="ms-3">Profile</span>
                            </A>
                        </li>
                        <li>
                            <A
                                href={`/dashboard/${params.id}/images`}
                                class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                                activeClass="bg-gray-100 dark:bg-gray-700 dark:text-white"
                            >
                                <span class="flex-1 ms-3 whitespace-nowrap">Images</span>
                            </A>
                        </li>
                        <li>
                            <A
                                href={`/dashboard/${params.id}/documents`}
                                class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                                activeClass="bg-gray-100 dark:bg-gray-700 dark:text-white"
                            >
                                <span class="flex-1 ms-3 whitespace-nowrap">Documents</span>
                            </A>
                        </li>
                    </ol>
                    <ol class="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                        <li>
                            <A
                                href={`/dashboard/${params.id}/settings`}
                                class="flex items-center p-2 text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group"
                                activeClass="bg-gray-100 dark:bg-gray-700 dark:text-white"
                            >
                                <span class="ms-3">Settings</span>
                            </A>
                        </li>
                        <li>
                            <a
                                href="#"
                                class="flex items-center p-2 text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group"
                            >
                                <span class="ms-3">Logout</span>
                            </a>
                        </li>
                    </ol>
                </div>
            </aside>
            <div class="p-4 sm:ml-64">{props.children}</div>
        </>
    );
}
