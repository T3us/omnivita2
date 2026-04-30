import { query } from './db.mjs';
import { characterToRowPayload, rowToCharacter } from './serializers.mjs';

const SELECT_CHARACTER_SQL = `
  SELECT
    c.*,
    u.username AS owner_username
  FROM characters c
  LEFT JOIN users u ON u.id = c.owner_user_id
`;

export async function listCharacters(client) {
  const result = await query(
    `${SELECT_CHARACTER_SQL} ORDER BY lower(c.name), c.created_at`,
    [],
    client
  );
  return result.rows.map(rowToCharacter);
}

export async function getCharacterById(characterId, client) {
  const result = await query(
    `${SELECT_CHARACTER_SQL} WHERE c.id = $1 LIMIT 1`,
    [characterId],
    client
  );
  return result.rows[0] ? rowToCharacter(result.rows[0]) : null;
}

export async function getCharacterRowById(characterId, client) {
  const result = await query(
    `${SELECT_CHARACTER_SQL} WHERE c.id = $1 LIMIT 1`,
    [characterId],
    client
  );
  return result.rows[0] || null;
}

export async function getCharacterByOwnerUserId(ownerUserId, client) {
  const result = await query(
    `${SELECT_CHARACTER_SQL} WHERE c.owner_user_id = $1 LIMIT 1`,
    [ownerUserId],
    client
  );
  return result.rows[0] ? rowToCharacter(result.rows[0]) : null;
}

export async function saveCharacter(existingRow, characterInput, client) {
  const payload = characterToRowPayload(characterInput, existingRow || {});

  const result = await query(
    `
      UPDATE characters
      SET
        name = $2,
        age = $3,
        character_class = $4,
        level = $5,
        status = $6,
        profile_image_url = $7,
        sheet = $8,
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      payload.id,
      payload.name,
      payload.age,
      payload.character_class,
      payload.level,
      payload.status,
      payload.profile_image_url,
      payload.sheet
    ],
    client
  );

  if (!result.rows[0]) return null;
  return getCharacterById(payload.id, client);
}
