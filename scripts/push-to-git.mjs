import { execSync } from "child_process"

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: "inherit" })
}

try {
  console.log("\n🚀 Preparing to push MapleInsight project to GitHub")

  // Check git
  run("git --version")

  // Check status
  console.log("\n📋 Checking git status")
  run("git status")

  // Check if .env.local is staged
  const staged = execSync("git diff --name-only --cached || echo ''")
    .toString()

  if (staged.includes(".env.local")) {
    console.error(
      "\n❌ WARNING: .env.local is staged. This may expose secrets."
    )
    console.error("Run: git rm --cached .env.local")
    process.exit(1)
  }

  console.log("\n📦 Adding files")
  run("git add .")

  const message =
    process.argv[2] || "Update Maple Insight project"

  console.log("\n📝 Committing changes")
  run(`git commit -m "${message}"`)

  console.log("\n⬆️ Pushing to GitHub")
  run("git push origin main")

  console.log("\n✅ Push completed successfully")

} catch (err) {
  console.error("\n❌ Git push failed")
  console.error(err.message)
}