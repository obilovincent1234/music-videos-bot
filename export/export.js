var fs = require('fs')
var mongoose = require('mongoose')
mongoose.connect("mongodb://localhost:27017/COM_WATCH", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("connected to com_watch database");

});
var Movie = require('../models/Movie')
var movieData = fs.readFileSync('path')
var parsedData = JSON.parse(movieData.toString())
parsedData.forEach(item => {
  Movie.create(item).then(movie => {
    console.log(movie.name + '  created')
  }).catch(err => {
    console.log(err)
  })
})