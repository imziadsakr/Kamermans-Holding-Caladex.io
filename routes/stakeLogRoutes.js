const express = require('express');
const router = express.Router();
const stakeLogController = require('../controllers/stakeLogController');

router.post('/get', stakeLogController.getAllStakeLogs);
router.post('/get/:address', stakeLogController.getStakeLog);
router.post('/add', stakeLogController.addStakeLog);
router.post('/unstake', stakeLogController.unStake);
router.post('/info', stakeLogController.getStakeLogInfo);



module.exports = router;