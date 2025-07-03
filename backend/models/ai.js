// models/Ai.js
const mongoose = require("mongoose");

const aiSchema = new mongoose.Schema({
    prompt: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    },
}, { timestamps: true });

const Ai = mongoose.model("Ai", aiSchema);

module.exports = Ai;