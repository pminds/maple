import { readFile, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"

const source = await readFile(new URL("./wrangler.jsonc", import.meta.url), "utf8")
const connectionString = process.env.MAPLE_PG_URL ?? "postgres://maple:maple@localhost:5499/maple"
const config = source.replace(
	/("localConnectionString"\s*:\s*)"[^"]*"/,
	(_, prefix) => `${prefix}${JSON.stringify(connectionString)}`,
)
const configPath = "/app/apps/api/wrangler.railway.jsonc"
await writeFile(configPath, config)

const port = Number(process.env.PORT ?? "8080")
const child = spawn(
	process.execPath,
	[
		"/app/apps/api/node_modules/wrangler/bin/wrangler.js",
		"dev",
		"--local",
		"--config",
		configPath,
		"--ip",
		"0.0.0.0",
		"--port",
		String(port),
		"--inspector-port",
		String(port + 10000),
	],
	{ env: process.env, stdio: "inherit" },
)

child.on("exit", (code, signal) => {
	if (signal) process.kill(process.pid, signal)
	else process.exit(code ?? 1)
})

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => child.kill(signal))
}
