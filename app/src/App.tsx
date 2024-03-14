import solidLogo from "./assets/solid.svg";
import viteLogo from "/vite.svg";
import { Router } from "@solidjs/router";

import { routes } from "./routes";

export default function App() {
    return (
        <>
            <header>
                <img height={24} width={24} src={solidLogo} alt="Solid Logo" />
                <img height={24} width={24} src={viteLogo} alt="Vite Logo" />
                <h1>Welcome to Vite + Solid!</h1>
            </header>
            <main>
                <Router>{routes}</Router>
            </main>
        </>
    );
}
