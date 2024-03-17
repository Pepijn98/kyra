import type { Config } from "tailwindcss";
import flowbite from "flowbite/plugin";

const config: Config = {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx,css,scss,html}"],
    darkMode: "class",
    theme: {
        extend: {},
    },
    plugins: [flowbite],
};

export default config;
