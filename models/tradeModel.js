const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
    trader: {
        type: String,
        default: ""
    },
    time: {
        type: Date,
        default: ""
    },
    token_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token'
    },
    pair_token: {
        type: String,
        default: "DAI"
    },
    price: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ["buy", "sell"],
        default: "sell"
    },

});

const Trade = mongoose.model("Trade", tradeSchema);
module.exports = Trade;