var mongoose = require("mongoose");

var ObjectId = mongoose.Schema.Types.ObjectId;

var logSchema = new mongoose.Schema({
  id: ObjectId,
  value: String,
  type: String,
  is_movie:Boolean,
  founded:String,
  user: {
    ref: "User",
    type: ObjectId
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  }
});

module.exports = mongoose.model("Log", logSchema);