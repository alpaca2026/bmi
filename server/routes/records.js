const express = require('express');
const router = express.Router();
const { upsertRecord, getRecordsByUser, getRecordsForGraph, deleteRecord } = require('../models/record');

function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ errors: ['セッションが切れました。再度ログインしてください'] });
    }
    next();
}

router.use(authMiddleware);

router.get('/', (req, res) => {
    try {
        const records = getRecordsByUser(req.session.userId);
        res.json({ records });
    } catch (err) {
        res.status(500).json({ errors: ['サーバーエラーが発生しました'] });
    }
});

router.post('/', (req, res) => {
    const { record_date, height, weight } = req.body;

    const errors = [];
    if (!record_date || record_date.trim() === '') {
        errors.push('日付を入力してください');
    } else if (isNaN(Date.parse(record_date))) {
        errors.push('正しい日付を入力してください');
    }
    if (height === undefined || height === null || height === '') {
        errors.push('身長を入力してください');
    } else if (isNaN(Number(height))) {
        errors.push('身長は数値で入力してください');
    } else if (Number(height) <= 0) {
        errors.push('身長は正の数値で入力してください');
    }
    if (weight === undefined || weight === null || weight === '') {
        errors.push('体重を入力してください');
    } else if (isNaN(Number(weight))) {
        errors.push('体重は数値で入力してください');
    } else if (Number(weight) <= 0) {
        errors.push('体重は正の数値で入力してください');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const h = Number(height);
    const w = Number(weight);
    const heightInMeters = h / 100;
    const bmi = Math.round((w / (heightInMeters * heightInMeters)) * 10) / 10;

    try {
        upsertRecord(req.session.userId, record_date, h, w, bmi);
        const records = getRecordsByUser(req.session.userId);
        res.status(201).json({ bmi, records });
    } catch (err) {
        res.status(500).json({ errors: ['サーバーエラーが発生しました'] });
    }
});

router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ errors: ['不正なリクエストです'] });
    }

    try {
        const deleted = deleteRecord(id, req.session.userId);
        if (!deleted) {
            return res.status(404).json({ errors: ['レコードが見つかりません'] });
        }
        const records = getRecordsByUser(req.session.userId);
        res.json({ message: '削除成功', records });
    } catch (err) {
        res.status(500).json({ errors: ['サーバーエラーが発生しました'] });
    }
});

router.get('/graph', (req, res) => {
    try {
        const records = getRecordsForGraph(req.session.userId, 6);
        res.json({ records });
    } catch (err) {
        res.status(500).json({ errors: ['サーバーエラーが発生しました'] });
    }
});

module.exports = router;
