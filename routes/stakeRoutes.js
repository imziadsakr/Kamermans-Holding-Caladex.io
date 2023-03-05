const express = require('express');
const router = express.Router();
const stakeController = require('../controllers/stakeController');
const uploadStakeDoc = require('../utils/uploadStakeDoc');


router.post('/get', stakeController.getAllStakes);
router.post('/get/:id', stakeController.getStake);
router.post('/update/:id', stakeController.updateStake);
router.post('/delete/:id', stakeController.deleteStake);
router.post('/add', stakeController.addStake);
router.post('/search', stakeController.search);
router.post('/time', stakeController.getTime);
router.post('/upload', uploadStakeDoc, stakeController.upload);




module.exports = router;