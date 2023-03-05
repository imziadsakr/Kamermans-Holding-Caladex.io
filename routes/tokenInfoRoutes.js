const express = require('express');
const router = express.Router();
const TokenInfoController = require('../controllers/tokenInfoController');


router.post('/getall', TokenInfoController.getAllTokenInfos);
router.post('/get', TokenInfoController.getTokenInfos);
router.post('/getOne', TokenInfoController.getTokenInfo);




module.exports = router;