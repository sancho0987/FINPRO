'use strict';
const settings = require('../models/settings');
exports.get = (req, res) => res.json({ settings: settings.get(req.user.id) });
exports.update = (req, res) => res.json({ settings: settings.update(req.user.id, req.valid.body) });
