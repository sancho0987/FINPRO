'use strict';
const toCents = (n) => Math.round(Number(n) * 100);
const fromCents = (c) => Math.round(Number(c || 0)) / 100;
module.exports = { toCents, fromCents };
