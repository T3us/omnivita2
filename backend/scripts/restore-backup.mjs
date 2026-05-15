import fs from 'node:fs/promises';
import path from 'node:path';
import { restoreBackupPayload } from '../src/backups.mjs';
import { closeDb } from '../src/db.mjs';

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const fileArg = args.find((entry) => !entry.startsWith('--'));

if (!fileArg) {
  console.error('Uso: npm run restore:backup -- caminho/do/backup.json --confirm');
  process.exit(1);
}

try {
  const filePath = path.resolve(process.cwd(), fileArg);
  const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const result = await restoreBackupPayload(payload, { confirm });
  console.log(result.message);
  console.log(JSON.stringify(result.summary, null, 2));
  if (!confirm) {
    console.log('Rode novamente com --confirm para aplicar.');
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
