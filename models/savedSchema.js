const mongoose = require('mongoose')

const savedSchema = new mongoose.Schema({
    image: { type: String, required: true },
    mediaType: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    saved: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
})

module.exports = mongoose.model('Saved', savedSchema);