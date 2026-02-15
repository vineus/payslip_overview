#!/usr/bin/env node

const { execFileSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".payslip-overview"
);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PORT = process.env.PORT || 3000;
const standalonePath = path.join(__dirname, "..", ".next", "standalone");

if (fs.existsSync(standalonePath)) {
  // Production: use standalone server
  // Next.js standalone expects .next/static and public inside the standalone dir
  const pkgRoot = path.join(__dirname, "..");
  const staticSrc = path.join(pkgRoot, ".next", "static");
  const staticDest = path.join(standalonePath, ".next", "static");
  const publicSrc = path.join(pkgRoot, "public");
  const publicDest = path.join(standalonePath, "public");

  // Symlink .next/static → standalone/.next/static
  if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
    fs.symlinkSync(staticSrc, staticDest, "junction");
  }
  // Symlink public → standalone/public
  if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
    fs.symlinkSync(publicSrc, publicDest, "junction");
  }

  const serverPath = path.join(standalonePath, "server.js");
  console.log(`Starting Payslip Overview on http://localhost:${PORT}`);

  const server = spawn("node", [serverPath], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: "inherit",
  });

  // Open browser after a short delay
  setTimeout(() => {
    const url = `http://localhost:${PORT}`;
    try {
      if (process.platform === "darwin") execFileSync("open", [url]);
      else if (process.platform === "win32") execFileSync("cmd", ["/c", "start", url]);
      else execFileSync("xdg-open", [url]);
    } catch {
      console.log(`Open ${url} in your browser`);
    }
  }, 2000);

  process.on("SIGINT", () => {
    server.kill();
    process.exit(0);
  });
} else {
  // Development: use next dev
  console.log(`Starting Payslip Overview (dev) on http://localhost:${PORT}`);
  const next = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  });

  process.on("SIGINT", () => {
    next.kill();
    process.exit(0);
  });
}
