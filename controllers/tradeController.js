const Trade = require('../models/tradeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');

const CurrentTime = () => {
    
    let date = new Date();
    date.setHours(date.getHours()-4);

    return date;
}

exports.getAllTrades = async(req, res, next) => {
    try {
        console.log("get trade");
        const doc = await Trade.find(req.body).sort({time: -1});
        
        console.log('get');
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

exports.getTrade = base.getOne(Trade);

// Don't update password on this 
exports.updateTrade = base.updateOne(Trade);
exports.deleteTrade = base.deleteOne(Trade);

exports.addTrade = async(req, res, next) => {
    try {
        req.body.time = CurrentTime();
        const doc = await Trade.create(req.body);

        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.searchTrade = async (req, res, next) => {
    try {
        let { start_time, end_time} = req.body;

        let tmp_date  = new Date(end_time);
        end_time = tmp_date.setDate(tmp_date.getDate() + 1);

        req.body.start_time = null;
        req.body.end_time = null;
        
        let doc = await Trade.find(req.body).where('time').gte(start_time).lte(end_time).sort({time: -1}).populate('token_id');

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
