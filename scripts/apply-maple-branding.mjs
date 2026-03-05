import fs from "fs";
import path from "path";

const root = process.cwd();

const tailwindConfigPath = path.join(root, "tailwind.config.ts");
const globalsCssPath = path.join(root, "src", "app", "globals.css");
const layoutPath = path.join(root, "src", "app", "layout.tsx");

function exists(p) {
  return fs.existsSync(p);
}
function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}
function backup(p) {
  const bak = `${p}.bak`;
  if (exists(p) && !exists(bak)) fs.copyFileSync(p, bak);
}
function updateWholeFile(p, content) {
  backup(p);
  write(p, content);
  console.log(`✅ Updated: ${path.relative(root, p)}`);
}

// 1) tailwind.config.ts
const tailwindConfig = `import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial"],
      },
      colors: {
        maple: {
          red: "#D62828",
          green: "#1B4332",
          gold: "#F4A261",
          blue: "#1D4ED8",
          text: "#495057",
          soft: "#F5F5F5",
          white: "#FFFFFF",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [typography],
};

export default config;
`;

// 2) globals.css
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    background: #FFFFFF;
    color: #495057;
  }

  body {
    background: #FFFFFF;
    color: #495057;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4 {
    color: #111827;
    letter-spacing: -0.02em;
  }
}

/* Calm, readable article typography */
@layer components {
  .prose {
    color: #495057;
  }

  .prose a {
    color: #D62828; /* Maple Red */
    font-weight: 600;
    text-decoration: none;
  }
  .prose a:hover {
    text-decoration: underline;
  }

  .prose h2 {
    margin-top: 2.5rem;
    margin-bottom: 0.9rem;
    font-weight: 700;
  }
  .prose h3 {
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    font-weight: 700;
  }

  .prose p {
    margin-top: 1.1rem;
    margin-bottom: 1.1rem;
    line-height: 1.75;
  }

  .prose strong {
    color: #111827;
  }

  .prose blockquote {
    border-left-color: #1B4332; /* Forest Green */
  }

  .prose blockquote p {
    font-style: normal;
  }
}
`;

// 3) layout.tsx patch (safe)
// - Adds Inter import + const if missing
// - Adds inter.className to body className
function patchLayout() {
  if (!exists(layoutPath)) {
    console.log("⚠️ src/app/layout.tsx not found — skipping layout update.");
    return;
  }

  const before = read(layoutPath);
  let after = before;

  // Add Inter import if missing
  if (!after.includes('from "next/font/google"') || !after.includes("Inter")) {
    after = `import { Inter } from "next/font/google";\n` + after;
  }

  // Add inter const if missing
  if (!after.includes("const inter = Inter(")) {
    after = after.replace(
      /(\n)(export default function|export default async function)/,
      `\nconst inter = Inter({ subsets: ["latin"], display: "swap" });\n\n$2`
    );
    if (!after.includes("const inter = Inter(")) {
      // If pattern didn't match, append near top
      after = after.replace(
        /(import[\s\S]*?\n)\n/,
        `$1\nconst inter = Inter({ subsets: ["latin"], display: "swap" });\n\n`
      );
    }
  }

  // Patch <body> tag
  if (after.includes("<body") && !after.includes("inter.className")) {
    // If body already has className
    if (after.match(/<body[^>]*className=/)) {
      after = after.replace(
        /<body([^>]*)className=\{([^}]*)\}([^>]*)>/,
        `<body$1 className={\`\${inter.className} \${$2}\`}$3>`
      );
    } else {
      // If body has no className
      after = after.replace(
        /<body([^>]*)>/,
        `<body$1 className={\`\${inter.className} bg-white text-[color:#495057]\`}>`
      );
    }
  }

  if (after !== before) {
    backup(layoutPath);
    write(layoutPath, after);
    console.log(`✅ Updated: ${path.relative(root, layoutPath)}`);
  } else {
    console.log("ℹ️ layout.tsx unchanged (already styled or pattern not found).");
  }
}

console.log("== Applying Maple Insight branding ==");
updateWholeFile(tailwindConfigPath, tailwindConfig);

if (exists(globalsCssPath)) {
  updateWholeFile(globalsCssPath, globalsCss);
} else {
  console.log("⚠️ src/app/globals.css not found — skipping globals update.");
}

patchLayout();

console.log("\nNext steps:");
console.log("1) Ensure typography plugin is installed:");
console.log("   npm i -D @tailwindcss/typography");
console.log("2) Restart dev server:");
console.log("   Ctrl + C");
console.log("   npm run dev");