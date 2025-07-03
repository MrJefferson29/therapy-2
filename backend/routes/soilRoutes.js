const express = require('express');
const router = express.Router();
const soilController = require('../controllers/soilController');

// Route to receive soil data from Arduino
router.post('/data', soilController.receiveSoilData);

// Route to get soil data history
router.get('/history', soilController.getSoilHistory);

// Route to get latest soil data
router.get('/latest', soilController.getLatestSoilData);

module.exports = router;