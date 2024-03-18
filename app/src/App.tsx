import { Router } from "@solidjs/router";
import { routes } from "./routes";
import "flowbite";
import { AuthProvider } from "./providers/AuthProvider";

export default function App() {
    return (
        <>
            <AuthProvider>
                <main>
                    <Router>{routes}</Router>
                </main>
            </AuthProvider>
        </>
    );
}
