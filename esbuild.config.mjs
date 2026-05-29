import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { copyFileSync, existsSync, mkdirSync } from "fs";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron", ...builtins],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: "inline",
    sourcesContent: !prod,
    treeShaking: true,
    outfile: "dist/main.js",
});

if (prod) {
    await context.rebuild();
    if (!existsSync("dist")) mkdirSync("dist");
    if (existsSync("assets")) {
        if (!existsSync("dist/assets")) mkdirSync("dist/assets", { recursive: true });
        ["wechat-donate.jpg"].forEach((f) => {
            const src = `assets/${f}`;
            if (existsSync(src)) {
                copyFileSync(src, `dist/assets/${f}`);
                console.log(`Copied ${src} -> dist/assets/${f}`);
            }
        });
    }
    context.dispose();
} else {
    context.watch().catch(() => process.exit(1));
}
