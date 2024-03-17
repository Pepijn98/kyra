import { Router } from "@solidjs/router";
import { routes } from "./routes";
import "flowbite";

export default function App() {
    return (
        <>
            <main>
                <Router>{routes}</Router>
            </main>
        </>
    );
}
