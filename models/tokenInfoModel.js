const mongoose = require("mongoose");

const tokenInfoSchema = new mongoose.Schema({
    token_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token'
    },
    pair_token: {
        type: String,
        default: "DAI"
    },
    time: {
        type: Date,
        default: ""
    },
    price: {
        type: Number,
        default: 0
    },
    last_price: {
        type: Number,
        default: 0
    },
    day_change: {
        type: Number,
        default: 0
    },
    day_high: {
        type: Number,
        default: 0
    },
    day_low: {
        type: Number,
        default: 0
    },
    volume: {
        type: Number,
        default: 0
    },
    market_sell_price: {
        type: Number,
        default: 0
    },
    market_buy_price: {
        type: Number,
        default: 0
    },
});

const TokenInfo = mongoose.model("TokenInfo", tokenInfoSchema);
module.exports = TokenInfo;