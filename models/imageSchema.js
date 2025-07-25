const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    image: { type: String, required: true },
    mediaType: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
})

module.exports = mongoose.model('Image', imageSchema);