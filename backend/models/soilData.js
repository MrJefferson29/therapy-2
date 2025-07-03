const mongoose = require('mongoose');

const soilDataSchema = new mongoose.Schema({
    nitrogen: {
        type: Number,
        required: true,
        min: 0
    },
    phosphorus: {
        type: Number,
        required: true,
        min: 0
    },
    potassium: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    recommendations: {
        type: Map,
        of: {
            suitability: Number,
            notes: String
        },
        default: new Map()
    },
    soilHealth: {
        type: String,
        enum: ['Poor', 'Fair', 'Good', 'Excellent'],
        default: 'Fair'
    }
});

module.exports = mongoose.model('SoilData', soilDataSchema);
