import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx,css,scss,html}"],
    darkMode: "class",
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;
