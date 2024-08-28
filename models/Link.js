var mongoose = require ('mongoose')

var ObjectId = mongoose.Schema.Types.ObjectId

var linkSchema = new mongoose.Schema({
    id:ObjectId,
    user:[{ref:'User',type:ObjectId}],
    movie:{ref:'Movie',type:ObjectId}
})
var Link = mongoose.model('Link',linkSchema)
module.exports=Link