let Movie = require('./../models/Movie');
let User = require('./../models/User');
let Search = require('./../models/Search');
let Log = require('./../models/Log');
let mongoose = require('mongoose');

const helper = require('./../helpers/helpers');
const _ = require('lodash');
let userController = require('./../controller/UserController');

const canUseBot = async function (bot, user, chatId) {
    let searchDone = await Log.find({
        user: user._id,
        type: "done"
    }).count();

    return new Promise(async (resolve) => {

        if (searchDone > 1) {
            bot.getChatMember(process.env.CHANNEL_USERNAME, chatId).then(async (res) => {
                if (['member', 'administrator', 'creator'].includes(res.status)) {
                    resolve(true);
                }
                await Log.create({
                    type: "must_join_channel",
                    user: user._id
                });
                resolve(false);
            }).catch(e => {
                console.log(e);
            });
        } else {
            resolve(true);
        }
    });
};

const sendMovie = async function (bot, chatId, movie, movieLink, user) {
    let searchDone = await Log.find({
        user: user._id,
        type: "done"
    }).count();

    let caption = helper.generateCaption(movie, movieLink);

    await Log.create({
        value: movie.name,
        type: "done",
        user: user._id
    });

    if (!movie.cover) {
        await bot.sendMessage(chatId, caption, {
            parse_mode: "HTML"
        });
    } else {
        await bot.sendPhoto(chatId, movie.cover, {
            caption: caption,
            parse_mode: "HTML"
        });
    }

    if (searchDone % 5 === 0) {
        await bot.sendMessage(chatId, "It's that easy to download your favorite movie, could it get any better?😍");
    }

    if (searchDone % 4 === 0) {
        await bot.sendMessage(chatId, "If you liked it, introduce KamWatch to your friends so they can watch movies as quickly as possible 😍");
    }

    if (searchDone % 6 === 0) {
        await bot.sendMessage(chatId, "If the download link doesn't work, try other links or notify the admin.");
    }
};

exports.searchMovie = async (bot, msg, chatId) => {

    try {
        bot.sendMessage(chatId, `🔎Searching: ${msg.text}`);

        let queries = [
            msg.text.replace('/', ''),
            helper.removeSpaces(msg.text.replace('/', ''))
        ];
        let movies = await Movie.find({
            name: {
                $regex: queries.join("|"),
                $options: 'i'
            }
        }).select({
            'name': true
        }).limit(20);

        var query = [];
        let searchText = helper.removeSpaces(msg.text);
        let searchLetterIndex = parseInt(searchText.length / 4);
        if (movies.length === 0) {

            if (searchText.length > 4) {
                searchLetterIndex++;
                for (var i = searchText.length; i > searchLetterIndex; i--) {
                    query.push(searchText.substring(0, i));
                    query.push(searchText.substring(0, i) + " " + searchText.charAt(i));
                }
            } else {
                function getAllPermutations(string) {
                    var results = [];

                    if (string.length === 1) {
                        results.push(string);
                        return results;
                    }

                    for (var i = 0; i < string.length; i++) {
                        var firstChar = string[i];
                        var charsLeft = string.substring(0, i) + string.substring(i + 1);
                        var innerPermutations = getAllPermutations(charsLeft);
                        for (var j = 0; j < innerPermutations.length; j++) {
                            results.push(firstChar + innerPermutations[j]);
                        }
                    }
                    return results;
                }

                query = getAllPermutations(searchText);

                query = query.filter(q => q.length > 2);
            }

            query = query.join('|');
            movies = await Movie.find({ name: { $regex: query, $options: 'i' } }).limit(20);

        }

        if (movies.length === 0 && searchText.length > 4) {
            query = [];
            for (var i = searchText.length - 4; i > searchLetterIndex - 2; i--) {
                query.push(searchText.substring(i, searchText.length));
                query.push(searchText.charAt(i) + " " + searchText.substring(i + 1, searchText.length));
            }
            query = query.join('|');
            movies = await Movie.find({ name: { $regex: query, $options: 'i' } }).limit(20);
        }

        let user = await userController.findOrCreate(msg.from);

        let canUseBotValue = await canUseBot(bot, user, chatId);
        if (!canUseBotValue) {
            bot.sendMessage(chatId, `⚠To use this bot unlimited, just join the ${process.env.CHANNEL_USERNAME} channel and try again!!`);
            return false;
        }

        Search.create({
            input: msg.text,
            action: 'search',
            user: user._id
        });

        if (movies.length === 0) {
            await Log.create({
                value: msg.text,
                type: "no_result_search",
                user: user._id
            });
            bot.sendMessage(chatId, "Unfortunately, we didn't find anything😞\n ⚠We have registered your requested movie and will add it to the bot as soon as possible and notify you");
            return true;
        }

        if (movies.length === 1) {
            msg.text = '🎥' + movies[0].name;
            this.selectMovie(bot, msg, chatId);
            return false;
        }

        bot.sendMessage(
            chatId,
            `Well, now choose one of these movies. If your desired result is not on the list, don't forget to take a look at the end of the list:`, {
                reply_markup: {
                    keyboard: movies.map(movie => {
                        return ['🎥' + movie.name];
                    })
                }
            }
        );
    } catch (e) {
        console.log(e);
    }
};

exports.selectMovie = async (bot, msg, chatId) => {

    let movieName = msg.text.replace('🎥', '');

    let user = await userController.findOrCreate(msg.from);

    let canUseBotValue = await canUseBot(bot, user, chatId);
    if (!canUseBotValue) {
        bot.sendMessage(chatId, `⚠To use this bot unlimited, just join the ${process.env.CHANNEL_USERNAME} channel and try again!!`);
        return false;
    }

    let movie = await Movie.findOneAndUpdate({
        name: {
            $regex: movieName,
            $options: "i"
        }
    }, {
        $inc: {
            views: 1
        }
    });

    Search.create({
        input: movieName,
        action: 'movie_select',
        user: user._id
    });

    if (movie === null) {
        bot.sendMessage(chatId, "Error in retrieving information, please contact support😫");
        return false;
    }

    let cover = movie.cover;
    if (cover === null || cover === undefined) {
        // Get cover from API
        try {
            let movieSearches = await helper.searchMovieDB(movieName.replace(movie.year, ''), parseInt(movie.year));
            if (movieSearches.results.length > 0) {
                cover = movieSearches.results[0].poster_path;
                cover = "https://image.tmdb.org/t/p/original" + cover;
                movie.cover = cover;
                await Movie.findOneAndUpdate({
                    name: movieName
                }, {
                    cover: cover
                }, {
                    upsert: true,
                    setDefaultsOnInsert: true
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    if (movie.type === 'series') {

        let seasons = _.chain(movie.link)
            .mapValues('season')
            .toArray()
            .uniq()
            .map(season => {
                return [`🍿Season ${season}`];
            })
            .value();
        bot.sendMessage(chatId,
            `✨ Series ${msg.text.replace('🎥', '')} selected\nNow choose your desired season to get the links:`, {
                reply_markup: {
                    keyboard: seasons
                }
            }
        );
        return false;
    }

    if (movie.link.length <= 4) {
        sendMovie(bot, chatId, movie, movie.link, user);
        return true;
    }

    
    bot.sendMessage(chatId,
        `✨ The movie ${msg.text.replace('🎥', '')} has been selected\nNow choose one of the quality options from the links below and we'll send it to you:`, {
            reply_markup: {
                keyboard: movie.link.map(link => {
                    return [`📥${link.quality || ""} ${link.release || ""} ${link.dubbed ? 'Dubbed' : ''} ${link.censored ? 'Censored' : ''} ${link.size ? link.size.replace(" ", "") : ""}`.replace(/  +/g, ' ')]
                })
            }
        });
}

// Function to handle season selection and send episodes
exports.selectSeason = async function (bot, msg, chatId) {
    let seasonNumber = msg.text.replace('🍿', '').replace('Season', '').replace(' ', '').replace(/  +/g, '');

    let user = await userController.findOrCreate(msg.from);

    let canUseBotValue = await canUseBot(bot, user, chatId);
    if (!canUseBotValue) {
        bot.sendMessage(chatId, `⚠ To use the bot without limitations, please join the channel ${process.env.CHANNEL_USERNAME} and try again!!`)
        return false;
    }

    let movieName = await Search.findOne({
        action: 'movie_select',
        user: user._id
    }).sort({
        created_at: -1
    })
        .select(['input'])

    if (!movieName.input) {
        bot.sendMessage(chatId, "Error retrieving information, please contact support 😫");
        return false;
    }

    movieName = movieName.input;
    let movie = await Movie.findOne({
        name: movieName,
        type: 'series'
    });

    let episodes = movie.link.filter(li => {
        return li.season == seasonNumber;
    });

    episodes = _.chain(episodes).sortBy(e => {
        return e.episode;
    }).groupBy('episode').value();

    let caption = "🔥" + movie.name + " Season " + seasonNumber + "\n";

    if (movie.imdb !== null && movie.imdb !== undefined) {
        caption += ` ⭐IMDB: ${movie.imdb}\n`;
    }

    if (movie.description !== null && movie.description !== undefined) {
        caption += '\n';
        caption += ` ✍ Synopsis: ${movie.description}\n\n`;
    }

    _.forEach(episodes, (item, key) => {
        caption += `E${key}: `;

        item.forEach(e => {
            caption += ` <a href="${e.link}">${e.quality}${JSON.parse(e.dubbed) === true ? " Dubbed" : ""}</a> |`;
        })
        caption = caption.replace(/\|$/i, "");
        caption += "\n";
    });
    caption += "Free movie and series download bot";
    caption += "\n";
    caption += "@comewatch_bot";

    if (movie.cover !== null) {
        bot.sendPhoto(chatId, movie.cover, {
            caption,
            parse_mode: "HTML"
        });
    } else {
        bot.sendMessage(chatId, caption, {parse_mode: "HTML"});
    }
}

// Function to handle link selection and send movie download links
exports.linkSelect = async function (bot, msg, chatId) {
    let linkName = msg.text.replace('📥', '');

    let user = await userController.findOrCreate(msg.from);

    let canUseBotValue = await canUseBot(bot, user, chatId);
    if (!canUseBotValue) {
        bot.sendMessage(chatId, `⚠ To use the bot without limitations, please join the channel ${process.env.CHANNEL_USERNAME} and try again!!`)
        return false;
    }

    let movieName = await Search.findOne({
        action: 'movie_select',
        user: user._id
    }).sort({
        created_at: -1
    })
        .select(['input'])

    if (!movieName.input) {
        bot.sendMessage(chatId, "Error retrieving information, please contact support 😫");
        return false;
    }

    movieName = movieName.input;
    let movie = await Movie.findOne({
        name: movieName
    });

    let quality = helper.getQuality(linkName);
    let release = helper.getRelease(linkName);

    let size = helper.getSize(linkName);
    if (size) {
        size = size.replace(/(mb|gb|kb|bytes)/i, " $1");
    }
    let dubbed = helper.isDubbed(linkName);
    let censored = helper.isSansored(linkName);

    let links = movie.link.filter(lin => {
        if (lin.censored === undefined) {
            lin.censored = false;
        }

        if (lin.dubbed === undefined) {
            lin.dubbed = false;
        }

        return lin.quality == quality &&
            lin.release == release &&
            lin.size == size &&
            lin.dubbed == dubbed &&
            lin.censored == censored;
    })

    if (links.length === 0) {
        if (movie.link.length === 0) {
            bot.sendMessage(chatId, "Error retrieving link, please contact support 😫");
            return false;
        } else {
            links = movie.link;
        }
    }

    sendMovie(bot, chatId, movie, links, user);
}

// Function to send a welcome message to new users
exports.welcome = async function (bot, msg, chatId) {
    userController.findOrCreate(msg.from);
    bot.sendMessage(
        chatId,
        `👋 Hello ${msg.from.first_name}\nWelcome to the ComeWatch bot🎉\nYou can search among the 20,000 movies available in the bot and use them for free🤩🤩\nCurrently, we only have movies, but soon we will add series and many more features😎\nWrite the name of the movie you want and we will send you the link...`
    );
}

// Function to handle Arabic input errors
exports.arabicInput = async function (bot, msg, chatId) {
    await Log.create({
        value: msg.text,
        type: "persian_search",
    })
    bot.sendMessage(chatId, "⚠ Please do not use Persian letters\nThe bot only has a foreign movie archive\nTo search, enter the movie name in English, for example: Fight Club")
}
