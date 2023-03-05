const mongoose = require("mongoose");

const StakeLogSchema = new mongoose.Schema({
    address: {
        type: String,
        default: ""
    },
    stake_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stake'
    },
    amount: {
        type: Number,
        default: 0
    },
    begin_date: {
        type: Date,
        default: ""
    },
    finish_date: {
        type: Date,
        default: ""
    },
    duration: {
        type: Number,
        default: 0
    },
    is_finished: {
        type: Boolean,
        default: false  
    }
});

const StakeLog = mongoose.model("StakeLog", StakeLogSchema);
module.exports = StakeLog;