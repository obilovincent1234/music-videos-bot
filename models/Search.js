var mongoose = require('mongoose')

var ObjectId = mongoose.Schema.Types.ObjectId

var searchSchema = new mongoose.Schema({
    id: ObjectId,
    input: String,
    action: String,
    serie: String,
    season: String,
    user: {
        ref: 'User',
        type: ObjectId
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    }
})
var Search = mongoose.model('Search', searchSchema)

module.exports = Search;