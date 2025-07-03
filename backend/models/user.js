const express = require('express');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    profileImage: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin', 'therapist'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },      
})

module.exports = mongoose.model('User', userSchema);