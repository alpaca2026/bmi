const express = require('express');
const router = express.Router();
const { createUser, authenticateUser, findUserByUsername } = require('../models/user');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const errors = [];
    if (!username || username.trim() === '') {
        errors.push('ユーザー名を入力してください');
    }
    if (!password || password.trim() === '') {
        errors.push('パスワードを入力してください');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const user = authenticateUser(username, password);
    if (!user) {
        return res.status(401).json({ errors: ['ユーザー名またはパスワードが正しくありません'] });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ message: 'ログイン成功', user: { id: user.id, username: user.username } });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ errors: ['ログアウトに失敗しました'] });
        }
        res.json({ message: 'ログアウト成功' });
    });
});

router.post('/register', (req, res) => {
    const { username, password } = req.body;

    const errors = [];
    if (!username || username.trim() === '') {
        errors.push('ユーザー名を入力してください');
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
        errors.push('ユーザー名は半角英数字で入力してください');
    }
    if (!password || password.trim() === '') {
        errors.push('パスワードを入力してください');
    } else if (password.length < 8) {
        errors.push('パスワードは8文字以上で入力してください');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const existing = findUserByUsername(username);
    if (existing) {
        return res.status(409).json({ errors: ['このユーザー名は既に使用されています'] });
    }

    try {
        const userId = createUser(username, password);
        req.session.userId = userId;
        req.session.username = username;
        res.status(201).json({ message: '登録成功', user: { id: userId, username } });
    } catch (err) {
        res.status(500).json({ errors: ['ユーザー登録に失敗しました'] });
    }
});

router.get('/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ errors: ['セッションが切れました。再度ログインしてください'] });
    }
    res.json({ user: { id: req.session.userId, username: req.session.username } });
});

module.exports = router;
