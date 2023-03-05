const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderer: {
        type: String,
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
    remain_amount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ["buy", "sell"],
        default: "sell"
    },
    time: {
        type: Date,
    },
    is_traded: {
        type: Boolean,
        default: false
    }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;