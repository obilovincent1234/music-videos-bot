var express = require('express');
var router = express.Router();
var User = require('./../models/User')
var Movie = require('./../models/Movie')
const moment = require('moment');
const _ = require('lodash');
/* GET users listing. */
router.get('/', async function (req, res, next) {


    let query = {};

    if (req.query.hasOwnProperty('name')) {
        query.name = {
            $regex: req.query.name,
            $options: 'i'
        };
    }

    let movies = await Movie.find(query).limit(20);



    res.json({
        movies,
    })
});



router.get('/:id', async function (req, res) {
    let movie = await Movie.findOne({
        _id: req.params.id
    });

    if (!movie) {
        res.status(404);
        res.json({
            ok: false,
            code: 404
        })
        return;
    }


    res.json(movie);

});


router.put('/:id', async function (req, res) {


    let query = {};

    let mapper = [
        'name',
        'imdb',
        'description',
        'cover',
        'link',
    ];

    mapper.forEach(m => {
        if (req.body.hasOwnProperty(m)) {
            query[m] = req.body[m];
        }
    });



    let movie = await Movie.findOneAndUpdate({
        _id: req.params.id
    }, query);

    if (!movie) {
        res.status(404);
        res.json({
            ok: false,
            code: 404
        })
        return;
    }


    res.json({
        ok: true,
        msg: "movie updated successfully",
        movie
    });

});

module.exports = router;