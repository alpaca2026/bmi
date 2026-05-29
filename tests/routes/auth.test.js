const request = require('supertest');
const { cleanDb } = require('../setup');
const app = require('../../server/app');
const { createUser } = require('../../server/models/user');

beforeEach(() => { cleanDb(); });
afterAll(() => { cleanDb(); });

describe('認証ルート', () => {
    describe('POST /api/register', () => {
        test('UT-R-006: 正常なデータで登録成功', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({ username: 'newuser', password: 'password123' });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('登録成功');
            expect(res.body.user.username).toBe('newuser');
        });

        test('UT-R-007: 重複ユーザー名で登録失敗', async () => {
            createUser('existinguser', 'password123');

            const res = await request(app)
                .post('/api/register')
                .send({ username: 'existinguser', password: 'password123' });

            expect(res.status).toBe(409);
            expect(res.body.errors).toContain('このユーザー名は既に使用されています');
        });

        test('UT-R-008: ユーザー名に全角文字を含む場合バリデーションエラー', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({ username: 'テスト', password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('ユーザー名は半角英数字で入力してください');
        });

        test('UT-R-009: パスワードが8文字未満でバリデーションエラー', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({ username: 'shortpw', password: '1234567' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('パスワードは8文字以上で入力してください');
        });
    });

    describe('POST /api/login', () => {
        beforeEach(() => {
            createUser('loginuser', 'password123');
        });

        test('UT-R-001: 正しいユーザー名・パスワードでログイン成功', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: 'loginuser', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('ログイン成功');
            expect(res.body.user.username).toBe('loginuser');
        });

        test('UT-R-002: 誤ったパスワードでログイン失敗', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: 'loginuser', password: 'wrongpass' });

            expect(res.status).toBe(401);
            expect(res.body.errors).toContain('ユーザー名またはパスワードが正しくありません');
        });

        test('UT-R-003: ユーザー名未入力でバリデーションエラー', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: '', password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('ユーザー名を入力してください');
        });

        test('UT-R-004: パスワード未入力でバリデーションエラー', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: 'loginuser', password: '' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toContain('パスワードを入力してください');
        });
    });

    describe('POST /api/logout', () => {
        test('UT-R-005: ログアウト成功', async () => {
            const res = await request(app)
                .post('/api/logout');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('ログアウト成功');
        });
    });

    describe('GET /api/me', () => {
        test('UT-R-010: 認証済みでユーザー情報取得', async () => {
            const agent = request.agent(app);
            await agent
                .post('/api/register')
                .send({ username: 'meuser', password: 'password123' });

            const res = await agent.get('/api/me');
            expect(res.status).toBe(200);
            expect(res.body.user.username).toBe('meuser');
        });

        test('UT-R-011: 未認証でエラー', async () => {
            const res = await request(app).get('/api/me');
            expect(res.status).toBe(401);
            expect(res.body.errors).toContain('セッションが切れました。再度ログインしてください');
        });
    });
});
