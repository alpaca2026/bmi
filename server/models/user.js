const bcrypt = require('bcrypt');
const { getDb } = require('../database/init');

const SALT_ROUNDS = 10;

function createUser(username, password) {
    const db = getDb();
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const result = stmt.run(username, passwordHash);
    return result.lastInsertRowid;
}

function authenticateUser(username, password) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (!user) {
        return null;
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
        return null;
    }

    return { id: user.id, username: user.username };
}

function findUserByUsername(username) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username FROM users WHERE username = ?');
    return stmt.get(username);
}

module.exports = { createUser, authenticateUser, findUserByUsername };
