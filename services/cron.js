var Search = require('./../models/Search')
var Movie = require('./../models/Movie')
var Log = require('./../models/Log')
const moment = require('moment');
const rp = require('request-promise')
const _ = require('lodash');
const cheerio = require('cheerio');

exports.getNoResultSuggestion = async function () {
    //cron to get no result search
    let noResult = await Log.find({
            type: "no_result_search",
            is_movie: {
                $exists: false
            }
        }).sort({
            created_at: -1
        });

    noResult.forEach(async no => {

        if(no.value.length <= 2){
            await Log.findOneAndUpdate({
                _id: no._id
            }, {
                is_movie: false
            }, {
                upsert: true,
                setDefaultsOnInsert: true
            });
            return false;
        }

        if (no.is_movie !== undefined) {
            return false;
        }


        rp(`https://www.imdb.com/search/title/?title=${no.value}&title_type=feature,tv_movie,tv_series,short&adult=include&view=simple`)
            .then(async data => {
                let $ = cheerio.load(data);
                if ($('.mode-simple').length === 0) {
                    console.log(`no result: ${no.value}`);
                    await Log.findOneAndUpdate({
                        _id: no._id
                    }, {
                        is_movie: false
                    }, {
                        upsert: true,
                        setDefaultsOnInsert: true
                    });
                    return false;
                }
                let title = $('.mode-simple').eq(0).find('.col-title').find('a').text();
                console.log(`founded => ${title}`)
                let log = await Log.findOneAndUpdate({
                    _id: no._id
                }, {
                    is_movie: true,
                    founded: title
                }, {
                    upsert: true,
                    setDefaultsOnInsert: true
                });
            })
    })

}