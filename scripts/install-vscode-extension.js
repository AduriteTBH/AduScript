import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const homeDir = os.homedir();
const vsCodeExtDir = path.join(homeDir, '.vscode', 'extensions', 'aduscript-1.0.0');
const srcDir = path.resolve(process.cwd(), 'extensions', 'vscode-aduscript');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(vsCodeExtDir, { recursive: true });
  fs.cpSync(srcDir, vsCodeExtDir, { recursive: true });
  console.log(`\x1b[32m✔ Successfully installed AduScript VS Code extension into:\x1b[0m\n  ${vsCodeExtDir}`);
  console.log(`\n\x1b[36m👉 Next Step: Reload your VS Code window (Press Ctrl+Shift+P > Type "Developer: Reload Window" > Press Enter)\x1b[0m`);
  console.log(`   All .ads files will now display the official AduScript SVG logo and syntax highlighting!\n`);
} else {
  console.error('Source extension directory not found: ' + srcDir);
}
