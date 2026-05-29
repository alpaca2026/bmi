const request = require('supertest');
const { cleanDb } = require('../setup');
const app = require('../../server/app');

beforeEach(() => { cleanDb(); });
afterAll(() => { cleanDb(); });

describe('BMI算出ロジック検証', () => {
    let agent;

    beforeEach(async () => {
        agent = request.agent(app);
        await agent
            .post('/api/register')
            .send({ username: 'bmiuser', password: 'password123' });
    });

    const testCases = [
        { id: 'UT-BMI-001', height: 170, weight: 50, expectedBmi: 17.3, category: '低体重（やせ）' },
        { id: 'UT-BMI-002', height: 170, weight: 60, expectedBmi: 20.8, category: '普通体重' },
        { id: 'UT-BMI-003', height: 170, weight: 65, expectedBmi: 22.5, category: '普通体重' },
        { id: 'UT-BMI-004', height: 170, weight: 75, expectedBmi: 26.0, category: '肥満（1度）' },
        { id: 'UT-BMI-005', height: 170, weight: 90, expectedBmi: 31.1, category: '肥満（2度）' },
        { id: 'UT-BMI-006', height: 170, weight: 105, expectedBmi: 36.3, category: '肥満（3度）' },
        { id: 'UT-BMI-007', height: 170, weight: 120, expectedBmi: 41.5, category: '肥満（4度）' },
        { id: 'UT-BMI-008', height: 160, weight: 55, expectedBmi: 21.5, category: '普通体重' },
        { id: 'UT-BMI-009', height: 180, weight: 80, expectedBmi: 24.7, category: '普通体重' },
        { id: 'UT-BMI-010', height: 155, weight: 45, expectedBmi: 18.7, category: '普通体重' },
    ];

    testCases.forEach(({ id, height, weight, expectedBmi }) => {
        test(`${id}: 身長${height}cm, 体重${weight}kg → BMI ${expectedBmi}`, async () => {
            const res = await agent
                .post('/api/records')
                .send({
                    record_date: '2026-05-29',
                    height: String(height),
                    weight: String(weight)
                });

            expect(res.status).toBe(201);
            expect(res.body.bmi).toBe(expectedBmi);
        });
    });
});
