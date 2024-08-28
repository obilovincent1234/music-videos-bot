var express = require('express');
var router = express.Router();
var Search = require('./../models/Search')
var Movie = require('./../models/Movie')
var Log = require('./../models/Log')
const moment = require('moment');
const rp = require('request-promise')
const _ = require('lodash');
const cheerio = require('cheerio');
/* GET users listing. */
router.get('/', async function (req, res, next) {
    let searchesRecent = await Search.find({}).sort({
        created_at: -1
    }).populate('user').limit(40);

    let mostViewsMovies = await Movie.find({}).sort({
        views: -1
    }).limit(20).select(['name', 'views', 'cover']);


    let mostViewsMoviesToday = await Log.find({
            type: 'done',
            created_at: {
                $gt: moment().startOf('day')
            }
        }).select(['value']);


    mostViewsMoviesToday = await _.chain(mostViewsMoviesToday)
        .countBy('value')
        .map((val, key) => {
            return {
                name: key,
                count: val
            }
        })
        .sortBy('count')
        .reverse()
        .keyBy('name')
        .mapValues('count')
        .value();


    let noResult = await Log.find({
            type: "no_result_search"
        }).sort({
            created_at: -1
        }).limit(20)
        .select(['value', 'created_at', 'is_movie', 'founded']);


    res.json({
        noResult,
        mostViewsMoviesToday,
        mostViewsMovies,
        recent: searchesRecent
    })
});





// router.get('/create',User.create)
module.exports = router;