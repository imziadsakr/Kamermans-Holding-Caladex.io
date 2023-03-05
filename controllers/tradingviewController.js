const TradingView = require('../models/tradingViewModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');

const CurrentTime = () => {
    
    let date = new Date();
    date.setHours(date.getHours()-4);

    return date;
}

exports.getTradingView = async(req, res, next) => {
    try {
        console.log("get tradingview", req.body.token_id, req.body.pair_token);
        const doc = await TradingView.findOne(req.body).sort({time: -1});
        
        console.log('get', doc);
        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
        
    } catch (error) {
        next(error);
    }

};
