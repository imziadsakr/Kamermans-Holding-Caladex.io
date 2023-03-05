const express = require('express');
const router = express.Router();
const tradingviewController = require('../controllers/tradingviewController');

router.post('/get', tradingviewController.getTradingView);


module.exports = router;