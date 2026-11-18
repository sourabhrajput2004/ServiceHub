const dbKey = (table) => `servicehub_db_${table}`;

export function dbGetAll(table, fallback = []) {
  try {
    const raw = localStorage.getItem(dbKey(table));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function dbSetAll(table, rows) {
  localStorage.setItem(dbKey(table), JSON.stringify(rows));
  return rows;
}

export function dbFindById(table, id, fallback = []) {
  return dbGetAll(table, fallback).find((row) => row.id === id) || null;
}

export function dbUpsert(table, row, fallback = []) {
  const rows = dbGetAll(table, fallback);
  const index = rows.findIndex((item) => item.id === row.id);
  if (index >= 0) {
    rows[index] = { ...rows[index], ...row };
  } else {
    rows.unshift(row);
  }
  return dbSetAll(table, rows);
}
