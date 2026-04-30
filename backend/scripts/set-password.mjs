import { closeDb, pool } from '../src/db.mjs';
import { hashPassword, normalizeIdentifier } from '../src/security.mjs';

async function main() {
  const identifier = normalizeIdentifier(process.argv[2]);
  const password = String(process.argv[3] || '');

  if (!identifier || !password) {
    throw new Error('Uso: node scripts/set-password.mjs <username-ou-email> <nova-senha>');
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `
      UPDATE users
      SET
        password_hash = $2,
        must_reset_password = false,
        updated_at = now()
      WHERE lower(username) = $1 OR lower(email) = $1
      RETURNING id, username, email
    `,
    [identifier, passwordHash]
  );

  if (!result.rows[0]) {
    throw new Error('Usuario nao encontrado.');
  }

  console.log(`Senha atualizada para ${result.rows[0].username} <${result.rows[0].email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
