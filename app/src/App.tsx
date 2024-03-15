import { Router } from "@solidjs/router";

import { routes } from "./routes";

export default function App() {
    return (
        <>
            <main>
                <Router>{routes}</Router>
            </main>
        </>
    );
}
