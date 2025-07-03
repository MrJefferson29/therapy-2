const Journal = require('../models/journal');

// Create a new journal entry
exports.createJournal = async (req, res) => {
    try {
        const { title, note, mood, favorite } = req.body;
        
        // Validate required fields
        if (!title || !note || mood === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Title, note, and mood are required'
            });
        }

        // Validate mood value
        const validMoods = [1, 2, 3, 4, 5];
        if (!validMoods.includes(mood)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mood value. Must be 1, 2, 3, 4, or 5'
            });
        }

        const journalEntry = new Journal({
            title,
            note,
            mood,
            favorite: favorite || false,
            author: req.userId // Using req.userId from auth middleware
        });

        const savedEntry = await journalEntry.save();
        
        res.status(201).json({
            success: true,
            data: savedEntry,
            message: 'Journal entry created successfully'
        });
    } catch (error) {
        console.error('Error creating journal entry:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all journal entries for the authenticated user
exports.getAllJournals = async (req, res) => {
    try {
        const { mood, search, sort = 'createdAt' } = req.query;
        
        let query = { author: req.userId };
        
        // Filter by mood if provided
        if (mood) {
            const moodNum = parseInt(mood);
            if (![1, 2, 3, 4, 5].includes(moodNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid mood value'
                });
            }
            query.mood = moodNum;
        }
        
        // Search in title and note if provided
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } }
            ];
        }
        
        let sortOption = {};
        if (sort === 'createdAt') {
            sortOption = { createdAt: -1 }; // Newest first
        } else if (sort === 'favorite') {
            sortOption = { favorite: -1, createdAt: -1 }; // Favorites first, then by date
        }
        
        const journals = await Journal.find(query)
            .sort(sortOption)
            .populate('author', 'name email');
        
        res.status(200).json({
            success: true,
            data: journals,
            count: journals.length
        });
    } catch (error) {
        console.error('Error fetching journals:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get journal entry by ID
exports.getJournalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const journal = await Journal.findById(id)
            .populate('author', 'name email');
        
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        // Check if the user owns this journal entry
        if (journal.author._id.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        res.status(200).json({
            success: true,
            data: journal
        });
    } catch (error) {
        console.error('Error fetching journal by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get journal entries by author (for the authenticated user)
exports.getJournalsByAuthor = async (req, res) => {
    try {
        const { authorId } = req.params;
        
        // Users can only access their own journals
        if (authorId !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const journals = await Journal.find({ author: authorId })
            .sort({ createdAt: -1 })
            .populate('author', 'name email');
        
        res.status(200).json({
            success: true,
            data: journals,
            count: journals.length
        });
    } catch (error) {
        console.error('Error fetching journals by author:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update journal entry
exports.updateJournal = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, note, mood, favorite } = req.body;
        
        const journal = await Journal.findById(id);
        
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        // Check if the user owns this journal entry
        if (journal.author.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Validate mood if provided
        if (mood !== undefined) {
            const validMoods = [1, 2, 3, 4, 5];
            if (!validMoods.includes(mood)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid mood value. Must be 1, 2, 3, 4, or 5'
                });
            }
        }
        
        const updatedJournal = await Journal.findByIdAndUpdate(
            id,
            {
                ...(title && { title }),
                ...(note && { note }),
                ...(mood !== undefined && { mood }),
                ...(favorite !== undefined && { favorite })
            },
            { new: true, runValidators: true }
        ).populate('author', 'name email');
        
        res.status(200).json({
            success: true,
            data: updatedJournal,
            message: 'Journal entry updated successfully'
        });
    } catch (error) {
        console.error('Error updating journal:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete journal entry
exports.deleteJournal = async (req, res) => {
    try {
        const { id } = req.params;
        
        const journal = await Journal.findById(id);
        
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        // Check if the user owns this journal entry
        if (journal.author.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        await Journal.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Journal entry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting journal:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Toggle favorite status
exports.toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        
        const journal = await Journal.findById(id);
        
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        // Check if the user owns this journal entry
        if (journal.author.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        journal.favorite = !journal.favorite;
        const updatedJournal = await journal.save();
        
        res.status(200).json({
            success: true,
            data: updatedJournal,
            message: `Journal entry ${updatedJournal.favorite ? 'added to' : 'removed from'} favorites`
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}; 