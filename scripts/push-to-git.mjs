import { execSync } from "child_process";

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  console.log("Starting Git push process...\n");

  // ensure git exists
  run("git --version");

  // add files
  run("git add .");

  // commit
  const message =
    process.argv[2] || "Update Maple Insight project";

  run(`git commit -m "${message}"`);

  // push
  run("git push origin main");

  console.log("\nPush completed successfully.");
} catch (err) {
  console.error("\nGit push failed.");
  console.error(err.message);
}