import { buildBackupPayload, createBackupFilename, writeBackupFile } from '../src/backups.mjs';
import { closeDb } from '../src/db.mjs';

try {
  const payload = await buildBackupPayload({ reason: 'manual-cli-backup' });
  const result = await writeBackupFile(payload, { filename: createBackupFilename() });
  console.log(`Backup criado: ${result.filePath}`);
  console.log(JSON.stringify(payload.counts, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
