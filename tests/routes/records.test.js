const request = require('supertest');
const { cleanDb } = require('../setup');
const app = require('../../server/app');

beforeEach(() => { cleanDb(); });
afterAll(() => { cleanDb(); });

describe('履歴ルート', () => {
    let agent;

    beforeEach(async () => {
        agent = request.agent(app);
        await agent
            .post('/api/register')
            .send({ username: 'recordtestuser', password: 'password123' });
    });

    describe('POST /api/records', () => {
        test('UT-R-101: 正常な日付・身長・体重で登録成功', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '65' });

            expect(res.status).toBe(201);
            expect(res.body.bmi).toBeDefined();
            expect(res.body.records).toBeDefined();
            expect(Array.isArray(res.body.records)).toBe(true);
        });

        test('UT-R-102: BMI計算検証（身長170cm, 体重65kg → BMI 22.5）', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '65' });

            expect(res.status).toBe(201);
            expect(res.body.bmi).toBe(22.5);
        });

        test('UT-R-103: 日付未入力でバリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '', height: '170', weight: '65' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('日付を入力してください');
        });

        test('UT-R-104: 不正な日付でバリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: 'invalid-date', height: '170', weight: '65' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('正しい日付を入力してください');
        });

        test('UT-R-105: 身長未入力でバリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '', weight: '65' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('身長を入力してください');
        });

        test('UT-R-106: 体重未入力でバリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('体重を入力してください');
        });

        test('UT-R-107: 身長が数値でない場合バリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: 'abc', weight: '65' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('身長は数値で入力してください');
        });

        test('UT-R-108: 体重が数値でない場合バリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: 'xyz' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('体重は数値で入力してください');
        });

        test('UT-R-109: 身長が0以下でバリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '-1', weight: '65' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('身長は正の数値で入力してください');
        });

        test('UT-R-110: 体重が0以下でバリデーションエラー', async () => {
            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '0' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('体重は正の数値で入力してください');
        });

        test('UT-R-111: 同一日付で再登録するとUPSERTされる', async () => {
            await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '65' });

            const res = await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '70' });

            expect(res.status).toBe(201);
            expect(res.body.records).toHaveLength(1);
            expect(res.body.records[0].weight).toBe(70);
        });
    });

    describe('GET /api/records', () => {
        test('UT-R-112: 履歴一覧を取得できる', async () => {
            await agent
                .post('/api/records')
                .send({ record_date: '2026-05-28', height: '170', weight: '64' });
            await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '65' });

            const res = await agent.get('/api/records');
            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(2);
            // Descending order
            expect(res.body.records[0].record_date).toBe('2026-05-29');
            expect(res.body.records[1].record_date).toBe('2026-05-28');
        });
    });

    describe('DELETE /api/records/:id', () => {
        test('UT-R-113: 自分のレコードを削除成功', async () => {
            await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '65' });

            const getRes = await agent.get('/api/records');
            const recordId = getRes.body.records[0].id;

            const res = await agent.delete(`/api/records/${recordId}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('削除成功');
        });

        test('UT-R-114: 存在しないIDで削除失敗', async () => {
            const res = await agent.delete('/api/records/99999');
            expect(res.status).toBe(404);
            expect(res.body.errors).toContain('レコードが見つかりません');
        });
    });

    describe('GET /api/records/graph', () => {
        test('UT-R-115: グラフ用データを取得できる', async () => {
            await agent
                .post('/api/records')
                .send({ record_date: '2026-05-28', height: '170', weight: '64' });
            await agent
                .post('/api/records')
                .send({ record_date: '2026-05-29', height: '170', weight: '65' });

            const res = await agent.get('/api/records/graph');
            expect(res.status).toBe(200);
            expect(res.body.records).toBeDefined();
            // Ascending order
            expect(res.body.records[0].record_date).toBe('2026-05-28');
            expect(res.body.records[1].record_date).toBe('2026-05-29');
        });
    });

    describe('未認証アクセス', () => {
        test('UT-R-116: セッションなしで /api/records にアクセスすると401', async () => {
            const res = await request(app).get('/api/records');
            expect(res.status).toBe(401);
            expect(res.body.errors).toContain('セッションが切れました。再度ログインしてください');
        });
    });
});
