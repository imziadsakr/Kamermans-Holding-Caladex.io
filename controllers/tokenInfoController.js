const TokenInfo = require('../models/tokenInfoModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const Token = require('../models/tokenModel');

exports.getAllTokenInfos = base.getAll(TokenInfo);

exports.getTokenInfo = async(req, res, next) => {
    try {
        // console.log('get tokenInfo', req.body.token_id, req.body.pair_token);
        let doc = await TokenInfo.find(req.body).sort({_id : 1}).populate('token_id');
        // doc = doc[0];
        // console.log(doc);
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

exports.getTokenInfos = async(req, res, next) => {
    try {
        let doc = await TokenInfo.find({});
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
