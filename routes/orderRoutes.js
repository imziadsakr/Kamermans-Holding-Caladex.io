const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');


router.post('/getall', orderController.getAllOrders);
router.post('/get', orderController.getOrders);
router.post('/get/:id', orderController.getOrder);
router.post('/update/:id', orderController.updateOrder);
router.post('/delete/:id', orderController.deleteOrder);
router.post('/addlimit', orderController.addLimitOrder);
router.post('/market', orderController.MarketOrder);
router.post('/search', orderController.searchOrder);
router.post('/add', orderController.addOrder);




module.exports = router;