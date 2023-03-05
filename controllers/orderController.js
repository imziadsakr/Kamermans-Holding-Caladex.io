const Order = require('../models/orderModel');
const Trade = require('../models/tradeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const Web3 = require('web3');
const ethers = require('ethers');
const CALADEX_ABI = require('../utils/caladexABI.json');
const Token = require('../models/tokenModel');
const TokenInfo = require('../models/tokenInfoModel');
const Balance = require('../models/balanceModel');
const cronJob = require('../utils/cronJob');
const LIMIT = 1e-10;

exports.getAllOrders = base.getAll(Order);
exports.getOrder = base.getOne(Order);

const CurrentTime = () => {
    let date = new Date();
    date.setHours(date.getHours()-4);
    return date;
}

exports.getOrders = async(req, res, next) => {
    try {
        console.log("get Orders", req.body.type);
        req.body.is_traded = false;
        let doc = await Order.find(req.body).sort({price : -1});
        // console.log(doc);
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// Don't update password on this 
exports.updateOrder = base.updateOne(Order);
exports.deleteOrder = async(req, res, next) => {
    try {
        console.log('order canceling', req.params.id);

        const order = await Order.findOne({_id : req.params.id});

        const token0 = await Token.findOne({_id: order.token_id});
        const token1 = await Token.findOne({symbol : order.pair_token});

        let amount = order.remain_amount;

        console.log(order);
        if(order.type == "sell") {

            let balance = await Balance.findOne({address: order.orderer, token_id: token0._id});

            console.log(balance,  token0);
            if(balance.order_balance + LIMIT < amount) {
                res.status(201).json({
                    status: 'failed'
                });
                return;
            }
            balance.caladex_balance += Number(amount);
            balance.order_balance -= Number(amount);
            if(Math.abs(balance.order_balance) < LIMIT) balance.order_balance = 0;
            await balance.save();
            
            // let order_m  = await Order.findOne({time: order.time, token_id: token1._id, pair_token: token0.symbol, is_traded: false, orderer: order.orderer});
            // order_m.remove();
            order.remove();
        
        } else if (order.type == "buy") {

            let balance = await Balance.findOne({address: order.orderer, token_id: token1._id});

            if(balance.order_balance + LIMIT < amount * order.price) {
                res.status(201).json({
                    status: 'failed'
                });
                return;
            }

            balance.caladex_balance += Number(amount * order.price);
            balance.order_balance -= Number(amount * order.price);
            if(Math.abs(balance.order_balance) < LIMIT) balance.order_balance = 0;
            await balance.save();
                        
            // let order_m  = await Order.findOne({time: order.time, token_id: token1._id, pair_token: token0.symbol, is_traded: false, orderer: order.orderer});
            // order_m.remove();
            order.remove();

        }

        res.status(200).json({
            status: 'success',
        });
    } catch (err) {
        next(err);
    }
}

exports.addOrder  = async (req, res, next) => {
    try {
        req.body.time = CurrentTime();
        const doc = await Order.create(req.body);

        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc
            }
        });
    } catch(error) {
        next(error);
    }
}

exports.searchOrder = async (req, res, next) => {
    try {
        console.log("search order");

        let { start_time, end_time} = req.body;

        let tmp_date  = new Date(end_time);
        end_time = tmp_date.setDate(tmp_date.getDate() + 1);

        req.body.start_time = undefined;
        req.body.end_time = undefined;
        
        let doc = await Order.find(req.body).where('time').gte(start_time).lte(end_time).sort({time: -1}).populate('token_id');

        res.status(200).json({
            status: 'success',
            length : doc.length,
            data: {
                data: doc
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.addLimitOrder = async(req, res, next) => {
    try {
        req.body.time = CurrentTime();
        
        console.log(req.body.type, ' Order', req.body.price, req.body.amount);

        const token0  = await Token.findOne({_id: req.body.token_id});
        const token1 = await Token.findOne({symbol : req.body.pair_token});

        let orders = await Order.find({token_id: req.body.token_id, pair_token: req.body.pair_token, is_traded: false, type: (req.body.type == "buy" ? "sell" : "buy")}).where('price').equals(req.body.price).sort({time: 1}).populate('token_id');
        console.log(orders);
        let tokenInfo  = await TokenInfo.find({token_id: req.body.token_id, pair_token: req.body.pair_token}).sort({time: -1});
        tokenInfo = tokenInfo[0];

        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        
        
        if(req.body.type == 'sell') {
            orders = await Order.find({token_id: req.body.token_id, pair_token: req.body.pair_token, is_traded: false, type: "buy"}).where('price').gte(req.body.price).sort({price: -1}).populate('token_id');
        } else if(req.body.type == 'buy') {
            orders = await Order.find({token_id: req.body.token_id, pair_token: req.body.pair_token, is_traded: false, type: "sell"}).where('price').lte(req.body.price).sort({price: 1}).populate('token_id');
        }

        // console.log(orders);
        // if( (req.body.type == 'sell' && tokenInfo.market_sell_price > req.body.price && tokenInfo.market_sell_price > 0) || 
        //     (req.body.type == 'buy' && tokenInfo.market_buy_price < req.body.price && tokenInfo.market_buy_price > 0)) {
        //     console.log('limit market exchange');
            
        //     if(req.body.type == 'sell') {

        //         balance0.caladex_balance -= Number(amount);
        //         balance1.caladex_balance += Number(amount * price);
        //         await balance0.save();
        //         await balance1.save();

        //         let balance2 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token0._id});
        //         if(!balance2) { balance2 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token0._id}); }
        //         let balance3 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token1._id});
        //         if(!balance3) { balance3 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token1._id}); }

        //         balance2.caladex_balance += Number(amount);
        //         balance3.caladex_balance -= Number(amount * price);
        //         await balance2.save();
        //         await balance3.save();

        //     } else if(req.body.type == 'buy') {

        //         balance0.caladex_balance += Number(amount);
        //         balance1.caladex_balance -= Number(amount * price);
        //         await balance0.save();
        //         await balance1.save();

        //         let balance2 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token0._id});
        //         if(!balance2) { balance2 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token0._id}); }
        //         let balance3 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token1._id});
        //         if(!balance3) { balance3 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token1._id}); }
                
        //         balance2.caladex_balance -= Number(amount);
        //         balance3.caladex_balance += Number(amount * price);
        //         await balance2.save();
        //         await balance3.save();
        //     }
            

        //     let date= CurrentTime();
        //     let trade = new Trade;
        //     trade.trader = req.body.orderer;
        //     trade.time = date;
        //     trade.token_id = req.body.token_id;
        //     trade.pair_token = req.body.pair_token;
        //     trade.price = req.body.price;
        //     trade.amount = amount;
        //     trade.type = req.body.type;
        //     await trade.save();

            
        //     let trade_m = new Trade;
        //     trade_m.trader = req.body.orderer;
        //     trade_m.time = date;
        //     trade_m.token_id = token1._id;
        //     trade_m.pair_token = token0.symbol;
        //     trade_m.amount = amount * req.body.price;
        //     trade_m.price = 1 / req.body.price;
        //     trade_m.type = req.body.type == "sell" ? "buy" : "sell";
        //     await trade_m.save();

        //     res.status(200).json({
        //         status : 'success'
        //     });
        //     return;
        // }

        for(let order of orders) {
            let balance0 = await Balance.findOne({address: req.body.orderer, token_id: token0._id});
            if(!balance0) { balance0 = await Balance.create({address: req.body.orderer, token_id: token0._id}); }
            let balance1 = await Balance.findOne({address: req.body.orderer, token_id: token1._id});
            if(!balance1) { balance1 = await Balance.create({address: req.body.orderer, token_id: token1._id}); }

            if(order.remain_amount > amount) {
                
                if(req.body.type == 'sell') {

                    if(balance0.caladex_balance + LIMIT < amount) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }

                    balance0.caladex_balance -= Number(amount);
                    balance1.caladex_balance += Number(amount * price);

                    if(Math.abs(balance0.caladex_balance) < LIMIT) balance0.caladex_balance = 0;

                    await balance0.save();
                    await balance1.save();

                    let balance2 = await Balance.findOne({address: order.orderer, token_id: token0._id});
                    if(!balance2) { balance2 = await Balance.create({address: order.orderer, token_id: token0._id}); }
                    let balance3 = await Balance.findOne({address: order.orderer, token_id: token1._id});
                    if(!balance3) { balance3 = await Balance.create({address: order.orderer, token_id: token1._id}); }

                    if(balance3.order_balance + LIMIT < amount * price) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }

                    balance2.caladex_balance += Number(amount);
                    balance3.order_balance -= Number(amount * price);

                    if(Math.abs(balance3.order_balance) < LIMIT) balance3.order_balance = 0;

                    await balance2.save();
                    await balance3.save();
    
                } else if(req.body.type == 'buy') {

                    if(balance1.caladex_balance + LIMIT < amount * price) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }

                    balance0.caladex_balance += Number(amount);
                    balance1.caladex_balance -= Number(amount * price);
                    
                    if(Math.abs(balance1.caladex_balance) < LIMIT) balance1.caladex_balance = 0;

                    await balance0.save();
                    await balance1.save();
                    
                    let balance2 = await Balance.findOne({address: order.orderer, token_id: token0._id});
                    if(!balance2) { balance2 = await Balance.create({address: order.orderer, token_id: token0._id}); }
                    let balance3 = await Balance.findOne({address: order.orderer, token_id: token1._id});
                    if(!balance3) { balance3 = await Balance.create({address: order.orderer, token_id: token1._id}); }

                    if(balance2.order_balance + LIMIT < amount) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }

                    balance2.order_balance -= Number(amount);
                    balance3.caladex_balance += Number(amount * order.price);
                    
                    if(Math.abs(balance2.order_balance) < LIMIT) balance2.order_balance = 0;

                    await balance2.save();
                    await balance3.save();
                }

                let trade = new Trade;
                trade.trader = req.body.orderer;
                trade.time = req.body.time;
                trade.token_id = req.body.token_id;
                trade.pair_token = req.body.pair_token;
                trade.price = req.body.price;
                trade.amount = amount;
                trade.type = req.body.type;
                await trade.save();
                
                // let trade_m = new Trade;
                // trade_m.trader = req.body.orderer;
                // trade_m.time = req.body.time;
                // trade_m.token_id = token1._id;
                // trade_m.pair_token = token0.symbol;
                // trade_m.amount = amount * req.body.price;
                // trade_m.price = 1 / req.body.price;
                // trade_m.type = req.body.type == "sell" ? "buy" : "sell";
                // await trade_m.save();

                order.remain_amount -= Number(amount);
                await order.save();

                // let order_m  = await Order.findOne({time: order.time, token_id: token1._id, pair_token: token0.symbol, is_traded: false, orderer: order.orderer});
                // order_m.remain_amount -= Number(amount * order.price);
                // await order_m.save();

                amount = 0;
            } else {
                if(req.body.type == 'sell') {

                    if(balance0.caladex_balance + LIMIT < order.remain_amount) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }

                    balance0.caladex_balance -= Number(order.remain_amount);
                    balance1.caladex_balance += Number(order.remain_amount * price);
                    
                    if(Math.abs(balance0.caladex_balance) < LIMIT) balance0.caladex_balance = 0;

                    await balance0.save();
                    await balance1.save();
                    
                    let balance2 = await Balance.findOne({address: order.orderer, token_id: token0._id});
                    if(!balance2) { balance2 = await Balance.create({address: order.orderer, token_id: token0._id}); }
                    let balance3 = await Balance.findOne({address: order.orderer, token_id: token1._id});
                    if(!balance3) { balance3 = await Balance.create({address: order.orderer, token_id: token1._id}); }

                    if(balance3.order_balance + LIMIT < order.remain_amount * order.price) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }
    
                    balance2.caladex_balance += Number(order.remain_amount);
                    balance3.order_balance -= Number(order.remain_amount * order.price);
                    
                    if(Math.abs(balance3.order_balance) < LIMIT) balance3.order_balance = 0;

                    await balance2.save();
                    await balance3.save();
    
                } else if(req.body.type == 'buy') {
    
                    if(balance1.caladex_balance + LIMIT < order.remain_amount * price) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }

                    balance0.caladex_balance += Number(order.remain_amount);
                    balance1.caladex_balance -= Number(order.remain_amount * price);

                    if(Math.abs(balance1.caladex_balance) < LIMIT) balance1.caladex_balance = 0;

                    await balance0.save();
                    await balance1.save();

                    // console.log(balance0, balance1);
                    
                    let balance2 = await Balance.findOne({address: order.orderer, token_id: token0._id});
                    if(!balance2) { balance2 = await Balance.create({address: order.orderer, token_id: token0._id}); }
                    let balance3 = await Balance.findOne({address: order.orderer, token_id: token1._id});
                    if(!balance3) { balance3 = await Balance.create({address: order.orderer, token_id: token1._id}); }


                    if(balance2.order_balance + LIMIT < order.remain_amount) {
                        res.status(201).json({
                            status: 'failed'
                        });
                        return;
                    }


                    balance2.order_balance -= Number(order.remain_amount);
                    balance3.caladex_balance += Number(order.remain_amount * price);
                    
                    if(Math.abs(balance2.order_balance) < LIMIT) balance2.order_balance = 0;
                    
                    await balance2.save();
                    await balance3.save();
                    // console.log(balance2, balance3);
                }
    
                let trade = new Trade;
                trade.trader = req.body.orderer;
                trade.time = req.body.time;
                trade.token_id = req.body.token_id;
                trade.pair_token = req.body.pair_token;
                trade.price = order.price;
                trade.amount = order.remain_amount;
                trade.type = req.body.type;
                await trade.save();
                
                // let trade_m = new Trade;
                // trade_m.trader = req.body.orderer;
                // trade_m.time = req.body.time;
                // trade_m.token_id = token1._id;
                // trade_m.pair_token = token0.symbol;
                // trade_m.price = 1 / order.price;
                // trade_m.amount = order.remain_amount * req.body.price;
                // trade_m.type = req.body.type == "sell" ? "buy" : "sell";
                // await trade_m.save();

                amount -= order.remain_amount ;
                order.remain_amount = 0;
                order.is_traded = true;
                await order.save();

                // let order_m  = await Order.findOne({time: order.time, token_id: token1._id, pair_token: token0.symbol, is_traded: false, orderer: order.orderer});
                // order_m.remain_amount = 0;
                // order_m.is_traded = true;
                // await order_m.save();

            }
            await cronJob.updateTokenInfo(1);

            if(amount == 0) break;
        }         
        // 
        
        let balance0 = await Balance.findOne({address: req.body.orderer, token_id: token0._id});
        if(!balance0) { balance0 = await Balance.create({address: req.body.orderer, token_id: token0._id}); }
        let balance1 = await Balance.findOne({address: req.body.orderer, token_id: token1._id});
        if(!balance1) { balance1 = await Balance.create({address: req.body.orderer, token_id: token1._id}); }
        // if(amount > 0) {
        let is_traded = false;
        if(amount == 0) is_traded = true;
        console.log(req.body.type, 'orderListing');
        if(req.body.type == "sell") {
            
            if(balance0.caladex_balance + LIMIT < amount) {
                res.status(201).json({
                    status: 'failed'
                });
                return;
            }


            balance0.caladex_balance -= Number(amount);
            balance0.order_balance += Number(amount);

            if(Math.abs(balance0.caladex_balance) < LIMIT) balance0.caladex_balance = 0;

            await balance0.save();

            if(amount > LIMIT) req.body.amount = amount;
            req.body.remain_amount = amount > LIMIT ? amount: 0;
            req.body.is_traded = is_traded;
            await Order.create(req.body);

            // let order_m  = req.body;
            // order_m.token_id = token1._id;
            // order_m.pair_token = token0.symbol;
            // order_m.amount = (amount > LIMIT ? amount : 0) * req.body.price;
            // order_m.remain_amount = amount > LIMIT ? order_m.amount : 0;
            // order_m.price = 1 / order_m.price;
            // order_m.type = "buy";
            // await Order.create(order_m);
            
        } else if (req.body.type == "buy") {

            if(balance1.caladex_balance + LIMIT < amount * req.body.price) {
                res.status(201).json({
                    status: 'failed'
                });
                return;
            }


            balance1.caladex_balance -= Number(amount) * req.body.price;
            balance1.order_balance += Number(amount) * req.body.price;

            
            if(Math.abs(balance1.caladex_balance) < LIMIT) balance1.caladex_balance= 0;

            await balance1.save();
            
            if(amount > LIMIT) req.body.amount = amount;
            req.body.remain_amount = amount > LIMIT ? amount: 0;
            req.body.is_traded = is_traded;
            await Order.create(req.body);
                        
            // let order_m  = req.body;
            // order_m.token_id = token1._id;
            // order_m.pair_token = token0.symbol;
            // order_m.amount = (amount > LIMIT ? amount : 0) * req.body.price;
            // order_m.remain_amount = amount > LIMIT ? order_m.amount : 0;
            // order_m.price = 1 / order_m.price;
            // order_m.type = "sell";
            // await Order.create(order_m);

        }
        // }

        res.status(200).json({
            status: 'success',
        });
    } catch (error) {
        next(error);
    }
};

exports.MarketOrder = async(req, res, next) => {
    try {
        console.log('market exchange', req.body.type, req.body.token_id, req.body.pair_token, req.body.price, req.body.amount);
        req.body.time = CurrentTime();
        
        const token0  = await Token.findOne({_id: req.body.token_id});
        const token1 = await Token.findOne({symbol : req.body.pair_token});
        let tokenInfo  = await TokenInfo.find({token_id: req.body.token_id, pair_token: req.body.pair_token}).sort({time: -1});
        tokenInfo = tokenInfo[0];

        let balance0 = await Balance.findOne({address: req.body.orderer, token_id: req.body.token_id});
        if(!balance0) { balance0 = await Balance.create({address: req.body.orderer, token_id: req.body.token_id}); }
        let balance1 = await Balance.findOne({address: req.body.orderer, token_id: token1._id});
        if(!balance1) { balance1 = await Balance.create({address: req.body.orderer, token_id: token1._id}); }

        let amount = req.body.amount;
        let price = req.body.price;

        if(req.body.type == 'sell') {

            balance0.caladex_balance -= Number(amount);
            balance1.caladex_balance += Number(amount * price);

            if(Math.abs(balance0.caladex_balance) < LIMIT) balance0.caladex_balance = 0;

            await balance0.save();
            await balance1.save();

            let balance2 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token0._id});
            if(!balance2) { balance2 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token0._id}); }
            let balance3 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token1._id});
            if(!balance3) { balance3 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token1._id}); }

            balance2.caladex_balance += Number(amount);
            balance3.caladex_balance -= Number(amount * price);

            if(Math.abs(balance3.caladex_balance) < LIMIT) balance3.caladex_balance = 0;
            
            await balance2.save();
            await balance3.save();

        } else if(req.body.type == 'buy') {

            balance0.caladex_balance += Number(amount);
            balance1.caladex_balance -= Number(amount * price);
            
            if(Math.abs(balance1.caladex_balance) < LIMIT) balance1.caladex_balance = 0;
            
            await  balance0.save();
            await  balance1.save();

            let balance2 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token0._id});
            if(!balance2) { balance2 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token0._id}); }
            let balance3 = await Balance.findOne({address: process.env.BALANCE_ADDR, token_id: token1._id});
            if(!balance3) { balance3 = await Balance.create({address: process.env.BALANCE_ADDR, token_id: token1._id}); }

            balance2.caladex_balance -= Number(amount);
            balance3.caladex_balance += Number(amount * price);
            
            if(Math.abs(balance2.caladex_balance) < LIMIT) balance2.caladex_balance = 0;

            await balance2.save();
            await balance3.save();
        }
        

        let date= CurrentTime();
        let trade = new Trade;
        trade.trader = req.body.orderer;
        trade.time = date;
        trade.token_id = req.body.token_id;
        trade.pair_token = req.body.pair_token;
        trade.price = req.body.price;
        trade.amount = amount;
        trade.type = req.body.type;
        await trade.save();

        
        let trade_m = new Trade;
        trade_m.trader = req.body.orderer;
        trade_m.time = date;
        trade_m.token_id = token1._id;
        trade_m.pair_token = token0.symbol;
        trade_m.amount = amount * req.body.price;
        trade_m.price = 1 / req.body.price;
        trade_m.type = req.body.type == "sell" ? "buy" : "sell";
        await trade_m.save();

        res.status(200).json({
            status: 'success',
        });
    } catch (error) {
        next(error);
    }
};