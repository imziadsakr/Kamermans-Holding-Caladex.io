const StakeLog = require('../models/stakeLogModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const Web3 = require('web3');
const ethers = require('ethers');
const CALADEX_ABI = require('../utils/caladexABI.json');
const Balance = require('../models/balanceModel');
const Stake = require('../models/stakeModel');
const Token = require('../models/tokenModel');

exports.getAllStakeLogs = base.getAll(StakeLog);

exports.getStakeLog = async(req, res, next) => {
    try {
        let doc = await StakeLog.find({address: req.params.address}).where('is_finished').equals(false).populate('stake_id');

        let date = new Date();
        date.setHours(date.getHours()-4);

        for(let element of doc) {
            const finish_date= new Date(element.finish_date);
            element.duration = Math.floor((finish_date.getTime() - date.getTime()) / 1000 / 24 / 60 / 60);
        }
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

exports.addStakeLog = async(req, res, next) => {
    try {
        let {address, duration, amount, stake_id} = req.body;

        console.log('add stake');

        
        let date = new Date();
        date.setHours(date.getHours()-4);
        console.log(date);
        let finish_date = new Date(date);
        finish_date.setDate(finish_date.getDate() + duration);

        console.log(finish_date);
        req.body.begin_date = date;
        req.body.finish_date = finish_date;
        let stake = await Stake.findOne({_id: stake_id}).populate('token_id');
        let balance = await Balance.findOne({address: address, token_id: stake.token_id._id });

        console.log(address);
        console.log(duration);
        console.log(amount);
        console.log(stake.token_id.symbol);

        const stakelog = await StakeLog.create(req.body);

        if(Number(amount) <= 0 || balance.caladex_balance < Number(amount)) {
            res.status(201).json({
                status: 'failed',
            });
            return;
        }

        balance.caladex_balance -= Number(amount);
        balance.stake_balance += Number(amount);

        balance.save();

        res.status(200).json({
            status: 'success',
            data: {
                stakelog
            }
        });
        
    } catch (error) {
        next(error);
    }
};

exports.unStake = async(req, res, next) => {
    try {
        const {address, stakelog_id} = req.body;

        console.log('unstake', address, stakelog_id);
        let stakelog = await StakeLog.findOne({ _id : stakelog_id, is_finished : false });
        if(!stakelog) {
            res.status(201).json({
                status: 'failed',
                message: 'stake log not found'
            });
            return;
        }
        
        let stake = await Stake.findOne({_id: stakelog.stake_id}).populate('token_id');
        let balance = await Balance.findOne({address: address, token_id: stake.token_id._id });
        
        if(stakelog.amount < 0 || balance.stake_balance < stakelog.amount) {
            res.status(201).json({
                status: 'failed',
            });
            return;
        }
        
        stakelog.is_finished = true;
        stakelog.save();

        
        let date = new Date();
        date.setHours(date.getHours()-4);

        const expired = Math.floor((date.getTime() - stakelog.begin_date.getTime()) / 1000 / 24 / 60 / 60);

        if(expired < Number(stakelog.duration)) {
            balance.caladex_balance += Number(stakelog.amount);
            balance.stake_balance -= Number(stakelog.amount);
        } else {
            balance.caladex_balance += Number(stakelog.amount + stakelog.amount * stake.est_apy * expired / 100 / 365);
            balance.stake_balance -= Number(stakelog.amount);
        }

        balance.save();

        res.status(200).json({
            status: 'success',
            data: {
                stakelog
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getStakeLogInfo = async (req, res, next) => {
    try {
        const {stakelog_id } = req.body;
        const doc = await StakeLog.findOne({_id : stakelog_id});

        if(!doc) {
            res.status(201).json({
                status: "failed"
            });
            return;
        }

        res.status(200).json({
            status: "success",
            data: {
                doc
            }
        })
    }catch (err) {
        next(err);
    }
}