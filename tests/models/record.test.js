const { cleanDb } = require('../setup');
const { upsertRecord, getRecordsByUser, getRecordsForGraph, deleteRecord } = require('../../server/models/record');
const { createUser } = require('../../server/models/user');

beforeEach(() => { cleanDb(); });
afterAll(() => { cleanDb(); });

describe('履歴モデル', () => {
    let userId;

    beforeEach(() => {
        userId = createUser('recorduser', 'password123');
    });

    describe('upsertRecord', () => {
        test('UT-M-101: 日付・身長・体重・BMIを登録できる', () => {
            const id = upsertRecord(userId, '2026-05-29', 170, 65, 22.5);
            expect(id).toBeDefined();
            expect(typeof id).toBe('number');
        });

        test('UT-M-102: 同一ユーザー・同一日付で再登録すると更新される', () => {
            upsertRecord(userId, '2026-05-29', 170, 65, 22.5);
            upsertRecord(userId, '2026-05-29', 170, 70, 24.2);

            const records = getRecordsByUser(userId);
            expect(records).toHaveLength(1);
            expect(records[0].weight).toBe(70);
            expect(records[0].bmi).toBe(24.2);
        });
    });

    describe('getRecordsByUser', () => {
        test('UT-M-103: 履歴が日付降順で取得される', () => {
            upsertRecord(userId, '2026-05-27', 170, 64, 22.1);
            upsertRecord(userId, '2026-05-29', 170, 65, 22.5);
            upsertRecord(userId, '2026-05-28', 170, 64.5, 22.3);

            const records = getRecordsByUser(userId);
            expect(records).toHaveLength(3);
            expect(records[0].record_date).toBe('2026-05-29');
            expect(records[1].record_date).toBe('2026-05-28');
            expect(records[2].record_date).toBe('2026-05-27');
        });
    });

    describe('deleteRecord', () => {
        test('UT-M-104: 自分のレコードを削除できる', () => {
            upsertRecord(userId, '2026-05-29', 170, 65, 22.5);
            const records = getRecordsByUser(userId);
            const recordId = records[0].id;

            const result = deleteRecord(recordId, userId);
            expect(result).toBe(true);

            const afterDelete = getRecordsByUser(userId);
            expect(afterDelete).toHaveLength(0);
        });

        test('UT-M-105: 他ユーザーのレコードは削除できない', () => {
            const otherUserId = createUser('otheruser', 'password123');
            upsertRecord(otherUserId, '2026-05-29', 170, 65, 22.5);
            const records = getRecordsByUser(otherUserId);
            const recordId = records[0].id;

            const result = deleteRecord(recordId, userId);
            expect(result).toBe(false);

            const afterAttempt = getRecordsByUser(otherUserId);
            expect(afterAttempt).toHaveLength(1);
        });
    });

    describe('getRecordsForGraph', () => {
        test('UT-M-106: 過去6か月間のデータが日付昇順で取得される', () => {
            upsertRecord(userId, '2026-05-01', 170, 63, 21.8);
            upsertRecord(userId, '2026-04-15', 170, 64, 22.1);
            upsertRecord(userId, '2026-03-10', 170, 65, 22.5);

            const records = getRecordsForGraph(userId, 6);
            expect(records.length).toBeGreaterThanOrEqual(1);
            // Should be in ascending order
            for (let i = 1; i < records.length; i++) {
                expect(records[i].record_date >= records[i - 1].record_date).toBe(true);
            }
        });

        test('UT-M-107: 6か月以上前のデータが除外される', () => {
            upsertRecord(userId, '2025-01-01', 170, 80, 27.7);
            upsertRecord(userId, '2026-05-29', 170, 65, 22.5);

            const records = getRecordsForGraph(userId, 6);
            const oldRecord = records.find(r => r.record_date === '2025-01-01');
            expect(oldRecord).toBeUndefined();
        });
    });
});
