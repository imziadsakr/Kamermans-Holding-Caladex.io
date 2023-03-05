const Balance = require('../models/balanceModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const Web3 = require('web3');
const ethers = require('ethers');
const CALADEX_ABI = require('../utils/caladexABI.json');
const ERC20_ABI = require('../utils/erc20ABI.json');
const Token = require('../models/tokenModel');
const LIMIT = 1e-10;

const toFixed = (x) => {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split('e-')[1]);
      if (e) {
          x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
}

exports.getAllBalances = base.getAll(Balance);

exports.getBalance = async(req, res, next) => {
    try {
        // console.log(req.body.token_id);
        let doc;
        if(req.body.token_id == undefined)
            doc = await Balance.find({address: req.params.address}).populate('token_id');
        else
            doc = await Balance.findOne({address: req.params.address, token_id: req.body.token_id}).populate('token_id');
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

exports.getTokenBalance = async(req, res, next) => {
    try {
        
        const doc = await Balance.findOne(req.body).populate('token_id');

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

exports.getAccountBalance = async(req, res, next) => {
    try {
        const {account, symbol} = req.body;
        const token = await Token.findOne({symbol: symbol});
        const doc = await Balance.findOne({address: account, token_id: token._id});

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

exports.setBalance = async(req, res, next) => {
    try {
        const {address, token_id, amount, is_deposit} = req.body;

        console.log(address);
        console.log(token_id);
        console.log(amount);
        console.log(is_deposit);

        let balance = await Balance.findOne({ address, token_id });
        if(!balance) balance = await Balance.create(req.body);

        balance = await Balance.findOne({ address, token_id }).populate('token_id');

        if(!is_deposit) {
            console.log("withdraw");
            balance.caladex_balance -= Number(amount);
            if(balance.caladex_balance < LIMIT)
                balance.caladex_balance = 0;
        } else {
            console.log('deposit');
            balance.caladex_balance += Number(amount);
        }

        balance.save();

        res.status(200).json({
            status: 'success',
            data: {
                balance
            }
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.withdraw = async (req, res, next) => {
    try {

        const {account, amount, address, symbol} = req.body;
        console.log(account);
        console.log(amount);
        console.log(symbol);

        const token  = await Token.findOne({symbol: symbol});
        const balance = await Balance.findOne({address: account, token_id: token._id});
        
        if(amount - balance.caladex_balance > LIMIT) {
            console.log('error :' + error);
                res.status(201).json({
                status: 'failed! underprice',
            });
            return;
        }

        if(symbol == 'ETH') {

            const privateKey = process.env.BALANCE_PRIVATE_KEY;
            const web3 = new Web3(new Web3.providers.HttpProvider( process.env.PROVIDER));
            const etherReceiver = new web3.eth.Contract(CALADEX_ABI, process.env.CALADEX_ADDR);

            console.log("withdraw ETH");

            const tx = {
                to : process.env.CALADEX_ADDR,
                gasLimit: 70000,
                gasUsed: 21662,
                data : etherReceiver.methods.sendViaTransfer().encodeABI(),
                value: ethers.utils.parseEther(amount).toString()
            }

            web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
            web3.eth.sendSignedTransaction(signed.rawTransaction)
                .then((receipt) => {
                    console.log('success');
                    res.status(200).json({
                        status: 'success',
                    });
                })
                .catch((error) => {
                    console.log('error :' + error);
                    res.status(201).json({
                        status: 'failed',
                    });
                });
            });
        } else {
            console.log('approve', toFixed(Number(amount) * 10 ** token.decimal).toString());
            
            const privateKey = process.env.BALANCE_PRIVATE_KEY;
            const web3 = new Web3(new Web3.providers.HttpProvider( process.env.PROVIDER));
            const etherReceiver = new web3.eth.Contract(ERC20_ABI, address);
            
            const tx = {
                to : address,
                gasLimit: 70000,
                gasUsed: 21662,
                data : etherReceiver.methods.approve(process.env.CALADEX_ADDR, toFixed(amount * 10 ** token.decimal).toString()).encodeABI()
            }

            web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
            web3.eth.sendSignedTransaction(signed.rawTransaction)
                .then((receipt) => {
                    console.log('success');
                    res.status(200).json({
                        status: 'success',
                    });
                })
                .catch((error) => {
                    console.log('error :' + error);
                    res.status(201).json({
                        status: 'failed',
                    });
                });
            });
        }

    } catch (err) {
        next(err);
    }
};