const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');

router.post('/get', tradeController.getAllTrades);
router.post('/get/:id', tradeController.getTrade);
router.post('/update/:id', tradeController.updateTrade);
router.post('/delete/:id', tradeController.deleteTrade);
router.post('/add', tradeController.addTrade);
router.post('/search', tradeController.searchTrade);




module.exports = router;