const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');

router.post('/get', balanceController.getAllBalances);
router.post('/get/:address', balanceController.getBalance);
router.post('/getbalance', balanceController.getTokenBalance);
router.post('/set', balanceController.setBalance);
router.post('/withdraw', balanceController.withdraw);
router.post('/token', balanceController.getAccountBalance);




module.exports = router;