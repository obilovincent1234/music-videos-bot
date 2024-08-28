var mongoose = require('mongoose')

var ObjectId = mongoose.Schema.Types.ObjectId

var MovieSchema = new mongoose.Schema({
    id: ObjectId,
    name: String,
    year: String,
    category: [{type: Object}],
    imdb: String,
    cover: String,
    description: String,
    type: String,
    views: {type: Number, default: 0},
    link: [{type: Object}],
    report: [String]
})
MovieSchema.index({name: "text"});
var Movie = mongoose.model('Movie', MovieSchema)

module.exports = Movie;
