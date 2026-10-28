// Copies the pinned Lucide icon set (lucide-static) into public/icons so the design-system <Icon> mask works offline.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const src = join(import.meta.dirname, '..', 'node_modules', 'lucide-static', 'icons');
const dest = join(import.meta.dirname, '..', 'public', 'icons');
if (!existsSync(src)) { console.error('lucide-static is not installed — run npm install'); process.exit(1); }
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`icons: ${readdirSync(dest).length} files → public/icons`);
