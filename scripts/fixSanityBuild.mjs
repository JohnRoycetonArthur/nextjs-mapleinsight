import fs from "fs";
import { execSync } from "child_process";

function log(msg) {
  console.log(`\n🔧 ${msg}`);
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function writeFile(path, content) {
  fs.writeFileSync(path, content);
  console.log(`Updated: ${path}`);
}

function deleteFile(path) {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { force: true });
    console.log(`Deleted: ${path}`);
  }
}

try {

  log("Removing live preview file");
  deleteFile("src/sanity/lib/live.ts");

  log("Replacing Sanity client");

  writeFile(
    "src/sanity/lib/client.ts",
`import {createClient} from '@sanity/client'
import {apiVersion, dataset, projectId} from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})
`
  );

  log("Replacing Studio route");

  writeFile(
    "src/app/studio/[[...tool]]/page.tsx",
`export default function StudioPlaceholderPage() {
  return (
    <main style={{padding: "2rem"}}>
      <h1>Studio temporarily disabled</h1>
      <p>Re-enable Studio after dependency cleanup.</p>
    </main>
  )
}
`
  );

  log("Removing old node_modules");
  if (fs.existsSync("node_modules")) {
    fs.rmSync("node_modules", { recursive: true, force: true });
  }

  log("Removing package-lock.json");
  deleteFile("package-lock.json");

  log("Installing fresh dependencies");
  run("npm install");

  log("Checking for next-sanity");
  run("npm ls next-sanity || exit 0");

  log("Building project");
  run("npm run build");

  console.log("\n✅ Sanity cleanup complete. Ready to push to GitHub.");

} catch (err) {
  console.error("\n❌ Script failed:");
  console.error(err.message);
}