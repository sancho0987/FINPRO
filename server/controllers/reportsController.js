'use strict';
const reports = require('../services/reportService');
exports.summary = (req, res) => res.json(reports.summary(req.user.id, req.valid.query));
exports.monthly = (req, res) => res.json({ months: reports.monthly(req.user.id, req.valid.query) });
