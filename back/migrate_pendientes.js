import { db } from './src/db.js';

// ─── Helpers ───
async function columnExists(table, column) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`  ✔ ${table}.${column} ya existe.`);
    return false;
  }
  console.log(`  ➕ Agregando ${table}.${column}...`);
  await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  ✔ ${table}.${column} agregada.`);
  return true;
}

// ─── Genera un código de 6 dígitos que no exista ───
async function generateUniqueCode() {
  const [existing] = await db.query('SELECT code FROM families WHERE code IS NOT NULL AND code != ""');
  const usedCodes = new Set(existing.map(r => r.code));
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
  } while (usedCodes.has(code));
  usedCodes.add(code); // para evitar colisiones en la misma corrida
  return code;
}

async function migrate() {
  try {
    // ══════════════════════════════════════════════════
    // CAMBIO 1: daily_meals — marca de "completada"
    // ══════════════════════════════════════════════════
    console.log('\n📌 Cambio 1: daily_meals — marca de completada');
    await addColumnIfMissing('daily_meals', 'is_completed', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumnIfMissing('daily_meals', 'completed_at', 'DATETIME NULL DEFAULT NULL');

    // ══════════════════════════════════════════════════
    // CAMBIO 2: inventory — marca de "sobras"
    // ══════════════════════════════════════════════════
    console.log('\n📌 Cambio 2: inventory — marca de sobras');
    await addColumnIfMissing('inventory', 'is_leftover', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumnIfMissing('inventory', 'source_recipe_id', 'INT(11) NULL DEFAULT NULL');

    // ══════════════════════════════════════════════════
    // CAMBIO 3: families — limpiar códigos vacíos
    // ══════════════════════════════════════════════════
    console.log('\n📌 Cambio 3: families — asignar códigos a las que no tienen');
    const [emptyFamilies] = await db.query(
      'SELECT family_id, code FROM families WHERE code IS NULL OR code = ""'
    );

    if (emptyFamilies.length === 0) {
      console.log('  ✔ Todas las familias ya tienen código.');
    } else {
      console.log(`  ⚠ Encontradas ${emptyFamilies.length} familia(s) sin código. Asignando...`);
      for (const fam of emptyFamilies) {
        const newCode = await generateUniqueCode();
        await db.query('UPDATE families SET code = ? WHERE family_id = ?', [newCode, fam.family_id]);
        console.log(`  ✔ Familia #${fam.family_id} → código: ${newCode}`);
      }
    }

    console.log('\n✅ Migración completada exitosamente.\n');
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
