const SoilData = require('../models/soilData');

// Helper function to determine soil health
function determineSoilHealth(n, p, k) {
    // NPK ideal ranges (you can adjust these based on your requirements)
    const ranges = {
        nitrogen: { min: 140, max: 280 },
        phosphorus: { min: 10, max: 20 },
        potassium: { min: 180, max: 360 }
    };

    let score = 0;
    
    // Calculate score based on NPK values
    if (n >= ranges.nitrogen.min && n <= ranges.nitrogen.max) score++;
    if (p >= ranges.phosphorus.min && p <= ranges.phosphorus.max) score++;
    if (k >= ranges.potassium.min && k <= ranges.potassium.max) score++;

    // Determine health based on score
    switch(score) {
        case 3: return 'Excellent';
        case 2: return 'Good';
        case 1: return 'Fair';
        default: return 'Poor';
    }
}

// Helper function to get crop recommendations
function getCropRecommendations(n, p, k) {
    const recommendations = new Map();

    // Example crop requirements (you can expand this based on your needs)
    const crops = {
        'Tomatoes': { n: [150, 250], p: [15, 25], k: [200, 300] },
        'Lettuce': { n: [100, 200], p: [10, 20], k: [150, 250] },
        'Carrots': { n: [120, 220], p: [12, 22], k: [180, 280] },
        'Potatoes': { n: [160, 260], p: [16, 26], k: [220, 320] }
    };

    for (const [crop, requirements] of Object.entries(crops)) {
        let suitability = 0;
        let notes = [];

        // Check NPK suitability
        if (n >= requirements.n[0] && n <= requirements.n[1]) suitability += 0.33;
        else notes.push('Nitrogen levels need adjustment');

        if (p >= requirements.p[0] && p <= requirements.p[1]) suitability += 0.33;
        else notes.push('Phosphorus levels need adjustment');

        if (k >= requirements.k[0] && k <= requirements.k[1]) suitability += 0.34;
        else notes.push('Potassium levels need adjustment');

        recommendations.set(crop, {
            suitability: Math.round(suitability * 100),
            notes: notes.join('. ')
        });
    }

    return recommendations;
}

exports.receiveSoilData = async (req, res) => {
    try {
        const { nitrogen, phosphorus, potassium, latitude, longitude } = req.body;

        // Validate input
        if (!nitrogen || !phosphorus || !potassium) {
            return res.status(400).json({
                success: false,
                error: 'Missing NPK values'
            });
        }

        // Convert string values to numbers if needed
        const n = Number(nitrogen);
        const p = Number(phosphorus);
        const k = Number(potassium);

        // Create new soil data entry
        const soilData = new SoilData({
            nitrogen: n,
            phosphorus: p,
            potassium: k,
            location: {
                type: 'Point',
                coordinates: [longitude || 0, latitude || 0]
            },
            recommendations: getCropRecommendations(n, p, k),
            soilHealth: determineSoilHealth(n, p, k)
        });

        // Save to database
        await soilData.save();

        res.status(201).json({
            success: true,
            data: soilData
        });

    } catch (error) {
        console.error('Error saving soil data:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

exports.getSoilHistory = async (req, res) => {
    try {
        const soilData = await SoilData.find()
            .sort({ timestamp: -1 })
            .limit(10);

        res.json({
            success: true,
            data: soilData
        });

    } catch (error) {
        console.error('Error fetching soil history:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

exports.getLatestSoilData = async (req, res) => {
    try {
        const latestData = await SoilData.findOne()
            .sort({ timestamp: -1 });

        if (!latestData) {
            return res.status(404).json({
                success: false,
                error: 'No soil data found'
            });
        }

        res.json({
            success: true,
            data: latestData
        });

    } catch (error) {
        console.error('Error fetching latest soil data:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};