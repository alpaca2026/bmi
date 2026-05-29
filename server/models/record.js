const { getDb } = require('../database/init');

function upsertRecord(userId, recordDate, height, weight, bmi) {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT INTO bmi_records (user_id, record_date, height, weight, bmi, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, record_date)
        DO UPDATE SET height = excluded.height, weight = excluded.weight, bmi = excluded.bmi, updated_at = CURRENT_TIMESTAMP
    `);
    const result = stmt.run(userId, recordDate, height, weight, bmi);
    return result.lastInsertRowid;
}

function getRecordsByUser(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM bmi_records WHERE user_id = ? ORDER BY record_date DESC');
    return stmt.all(userId);
}

function getRecordsForGraph(userId, months) {
    const db = getDb();
    const stmt = db.prepare(`
        SELECT record_date, height, weight, bmi
        FROM bmi_records
        WHERE user_id = ? AND record_date >= date('now', '-' || ? || ' months')
        ORDER BY record_date ASC
    `);
    return stmt.all(userId, months);
}

function deleteRecord(id, userId) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM bmi_records WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
}

module.exports = { upsertRecord, getRecordsByUser, getRecordsForGraph, deleteRecord };
