const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    note: {
        type: String,
        required: true,
    },
    mood: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: true,
    },
    favorite: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Journal', journalSchema);