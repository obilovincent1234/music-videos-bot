var Search = require('./../models/Search')
var Movie = require('./../models/Movie')
var Log = require('./../models/Log')
const moment = require('moment');
const rp = require('request-promise')
const _ = require('lodash');
const cheerio = require('cheerio');
const mongoose = require('mongoose')
const request = require('request')
require('dotenv').config({
    path: './../.env'
})

mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.MONGO_DB}`, {
    useNewUrlParser: true,
    authSource: 'admin',
    useUnifiedTopology: true
});
var db = mongoose.connection;



var findCovers = async function () {


    let movies = await Movie.find({
        cover: null
    }).limit(1);

    console.log('s')
    console.log(`movies in db => ${movies.length}`)
    movies.forEach(async (movie) => {
        let movieName = movie.name.replace(/((20|19)[0-9]{2})/g,'');
        let url = encodeURI(`https://www.imdb.com/search/title/?title=${movieName}&title_type=feature,tv_movie,tv_series,short&adult=include&view=simple`);
        request(url, function (error, response, body) {


            let $ = cheerio.load(body);
            if ($('.mode-simple').length === 0) {
                console.log(`no result: @${movieName}@`);
                return false;
            }
            let src = $('.mode-simple').eq(0).find('.lister-item-image').find('img').attr('src');
            console.log(`founded ${movieName} => ${src}`)

        })

    })

}

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log('db connected')
    findCovers();
});