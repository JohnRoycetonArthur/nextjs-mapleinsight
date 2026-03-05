import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

function walk(dir, callback) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      if (file === ".git" || file === "node_modules" || file === ".next") continue;
      walk(full, callback);
    } else {
      callback(full);
    }
  }
}

console.log("Cleaning backup files...");

let removed = 0;

walk(root, (file) => {
  if (file.endsWith(".bak")) {
    fs.unlinkSync(file);
    removed++;
  }
});

console.log(`Removed ${removed} backup files`);

console.log("\nChecking .gitignore...");

const gitignore = path.join(root, ".gitignore");

let gitignoreContent = "";

if (fs.existsSync(gitignore)) {
  gitignoreContent = fs.readFileSync(gitignore, "utf8");
}

const needed = [".next", "node_modules", ".env"];

let updated = false;

needed.forEach((item) => {
  if (!gitignoreContent.includes(item)) {
    gitignoreContent += `\n${item}`;
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync(gitignore, gitignoreContent);
  console.log(".gitignore updated");
} else {
  console.log(".gitignore already good");
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

console.log("\nStaging files...");
run("git add .");

console.log("\nCreating commit...");

try {
  run(`git commit -m "Maple Insight MVP: articles, homepage layout, calculators, branding"`);
} catch {
  console.log("Nothing new to commit");
}

console.log("\nPushing to GitHub...");

try {
  run("git push origin main");
} catch {
  console.log("Push failed. You may need to set upstream:");
  console.log("git push -u origin main");
}

console.log("\nDone. Your code is now pushed.");