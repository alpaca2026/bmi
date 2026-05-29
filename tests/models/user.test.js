const { cleanDb } = require('../setup');
const { createUser, authenticateUser, findUserByUsername } = require('../../server/models/user');

beforeEach(() => { cleanDb(); });
afterAll(() => { cleanDb(); });

describe('ユーザーモデル', () => {
    describe('createUser', () => {
        test('UT-M-001: 正常なユーザー名とパスワードでユーザーを作成できる', () => {
            const userId = createUser('testuser', 'password123');
            expect(userId).toBeDefined();
            expect(typeof userId).toBe('number');
            expect(userId).toBeGreaterThan(0);
        });
    });

    describe('authenticateUser', () => {
        beforeEach(() => {
            createUser('authuser', 'correctpass');
        });

        test('UT-M-002: 正しいユーザー名・パスワードで認証成功', () => {
            const user = authenticateUser('authuser', 'correctpass');
            expect(user).not.toBeNull();
            expect(user.username).toBe('authuser');
            expect(user.id).toBeDefined();
        });

        test('UT-M-003: 誤ったパスワードで認証失敗', () => {
            const user = authenticateUser('authuser', 'wrongpass');
            expect(user).toBeNull();
        });

        test('UT-M-004: 存在しないユーザーで認証失敗', () => {
            const user = authenticateUser('nonexistent', 'password123');
            expect(user).toBeNull();
        });
    });

    describe('findUserByUsername', () => {
        beforeEach(() => {
            createUser('finduser', 'password123');
        });

        test('UT-M-005: 存在するユーザー名で検索成功', () => {
            const user = findUserByUsername('finduser');
            expect(user).toBeDefined();
            expect(user.username).toBe('finduser');
        });

        test('UT-M-006: 存在しないユーザー名で検索するとundefined', () => {
            const user = findUserByUsername('nouser');
            expect(user).toBeUndefined();
        });
    });
});
