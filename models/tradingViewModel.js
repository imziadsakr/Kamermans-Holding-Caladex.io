const mongoose = require("mongoose");

const tradingviewSchema = new mongoose.Schema({
    token_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token'
    },
    pair_token: {
        type: String,
        default: "DAI",
    },
    information: {
        type: Array,
        default: []
    }
});

const TradingView = mongoose.model("TradingView", tradingviewSchema);
module.exports = TradingView;