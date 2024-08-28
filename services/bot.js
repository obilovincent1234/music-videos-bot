let Movie = require('./../models/Movie');
let User = require('./../models/User');
let Search = require('./../models/Search');
let Log = require('./../models/Log')
let mongoose = require('mongoose')

const helper = require('./../helpers/helpers')
const _ = require('lodash');
let userController = require('./../controller/UserController')


const canUseBot = async function (bot, user, chatId) {
    let searchDone = await Log.find({
        user: user._id,
        type: "done"
    }).count();

    return new Promise(async (resolve) => {

        if (searchDone > 1) {
            bot.getChatMember(process.env.CHANNEL_USERNAME, chatId).then(async (res) => {
                if (['member', 'administrator', 'creator'].includes(res.status)) {
                    resolve(true)
                }
                await Log.create({
                    type: "must_join_channel",
                    user: user._id
                })
                resolve(false)
            }).catch(e => {
                console.log(e)
            })
        } else {
            resolve(true)
        }
    })
}

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
    })

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
        await bot.sendMessage(chatId, "به همین راحتی میتونی فیلم مورد علاقت رو دانلود کنی،بهتر از اینم مگه میشه؟😍");
    }


    if (searchDone % 4 === 0) {
        await bot.sendMessage(chatId, "اگر راضی بودی کامواچ رو به دوستات معرفی کن تا اونا هم بتونن تو سریع ترین زمان ممکن فیلم ببینن 😍");
    }


    if (searchDone % 6 === 0) {
        await bot.sendMessage(chatId, "در صورت کار نکردن لینک  دانلود , لینک های دیگر را امتحان کنید یا به ادمین اطلاع دهید");
    }
}


exports.searchMovie = async (bot, msg, chatId) => {

    try {
        bot.sendMessage(chatId, `🔎درحال جستجو : ${msg.text}`);

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


            // console.table(query);
            query = query.join('|');
            // now place that new object into your mongoose query
            movies = await Movie.find({name: {$regex: query, $options: 'i'}}).limit(20);
            // console.timeEnd('searchText');

            // console.log(movies.map(movie => movie.name));

        }

        if (movies.length === 0 && searchText.length > 4) {
            query = [];
            for (var i = searchText.length - 4; i > searchLetterIndex - 2; i--) {
                query.push(searchText.substring(i, searchText.length))
                query.push(searchText.charAt(i) + " " + searchText.substring(i + 1, searchText.length));
            }
            // console.log('second time');
            // console.table(query);
            query = query.join('|');
            // now place that new object into your mongoose query
            movies = await Movie.find({name: {$regex: query, $options: 'i'}}).limit(20);
        }

        let user = await userController.findOrCreate(msg.from);


        let canUseBotValue = await canUseBot(bot, user, chatId);
        if (!canUseBotValue) {
            bot.sendMessage(chatId, `⚠برای استفاده  نامحدود از این ربات کافیست تا در کانال ${process.env.CHANNEL_USERNAME} عضو شوید و سپس دوباره سعی کنید!!`)
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
            })
            bot.sendMessage(chatId, "متاسفانه چیزی پیدا نکردیم😞\n ⚠فیلم درخواستی شما را ثبت کردیم و در اسرع وقت آن را به ربات اضافه خواهیم کرد و به شما اطلاع خواهیم داد")
            return true
        }


        if (movies.length === 1) {
            msg.text = '🎥' + movies[0].name
            this.selectMovie(bot, msg, chatId);
            return false;
        }


        bot.sendMessage(
            chatId,
            `خب حالا یکی از این فیلم ها رو انتخاب کن اگه نتیجه مورد نظرت توی لیست نبود یادت باشه یه نگاهی به آخر لیست هم بندازی :`, {
                reply_markup: {
                    keyboard: movies.map(movie => {
                        return ['🎥' + movie.name]
                    })
                }
            }
        );
    } catch (e) {
        console.log(e)
    }
}


exports.selectMovie = async (bot, msg, chatId) => {


    let movieName = msg.text.replace('🎥', '');


    let user = await userController.findOrCreate(msg.from);


    let canUseBotValue = await canUseBot(bot, user, chatId);
    if (!canUseBotValue) {
        bot.sendMessage(chatId, `⚠برای استفاده  نامحدود از این ربات کافیست تا در کانال ${process.env.CHANNEL_USERNAME} عضو شوید و سپس دوباره سعی کنید!!`)
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
    })

    Search.create({
        input: movieName,
        action: 'movie_select',
        user: user._id
    });


    if (movie === null) {
        bot.sendMessage(chatId, "خطا در دریافت اطلاعات،با پشتیبانی تماس بگیرین😫");
        return false;
    }

    let cover = movie.cover;
    if (cover === null || cover === undefined) {
        //get cover from api
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
                })
            }
        } catch (e) {
            console.log(e)
        }
    }

    if (movie.type === 'series') {


        let seasons = _.chain(movie.link)
            .mapValues('season')
            .toArray()
            .uniq()
            .map(season => {
                return [`🍿فصل ${season}`]
            })
            .value();
        bot.sendMessage(chatId,
            `✨ سریال ${msg.text.replace('🎥', '')} انتخاب شد\nحالا فصل مورد نظرت رو انتخاب کن تا لینکهاش رو برات بفرستیم:`, {
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
        `✨ فیلم ${msg.text.replace('🎥', '')} انتخاب شد\nحالا از بین لینک های زیر بین کیفیت های مختلف یکی رو انتخاب کن تا برات بفرستیم:`, {
            reply_markup: {
                keyboard: movie.link.map(link => {
                    return [`📥${link.quality || ""} ${link.release || ""} ${link.dubbed ? 'Dubbed' : ''} ${link.censored ? 'Censored' : ''} ${link.size ? link.size.replace(" ", "") : ""}`.replace(/  +/g, ' ')]
                })
            }
        });


}

exports.selectSeason = async function (bot, msg, chatId) {
    let seasonNumber = msg.text.replace('🍿', '').replace('فصل', '').replace(' ', '').replace(/  +/g, '');

    let user = await userController.findOrCreate(msg.from);


    let canUseBotValue = await canUseBot(bot, user, chatId);
    if (!canUseBotValue) {
        bot.sendMessage(chatId, `⚠برای استفاده  نامحدود از این ربات کافیست تا در کانال ${process.env.CHANNEL_USERNAME} عضو شوید و سپس دوباره سعی کنید!!`)
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
        bot.sendMessage(chatId, "خطا در دریافت اطلاعات،با پشتیبانی تماس بگیرین😫");
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
        caption += ` ✍خلاصه داستان: ${movie.description}\n\n`;
    }


    _.forEach(episodes, (item, key) => {
        caption += `E${key}: `;

        item.forEach(e => {
            caption += ` <a href="${e.link}">${e.quality}${JSON.parse(e.dubbed) === true ? " Dubbed" : ""}</a> |`;
        })
        caption = caption.replace(/\|$/i, "");
        caption += "\n";
    });
    caption += "ربات دانلود رایگان فیلم و سریال";
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

exports.linkSelect = async function (bot, msg, chatId) {

    let linkName = msg.text.replace('📥', '');

    let user = await userController.findOrCreate(msg.from);


    let canUseBotValue = await canUseBot(bot, user, chatId);
    if (!canUseBotValue) {
        bot.sendMessage(chatId, `⚠برای استفاده  نامحدود از این ربات کافیست تا در کانال ${process.env.CHANNEL_USERNAME} عضو شوید و سپس دوباره سعی کنید!!`)
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
        bot.sendMessage(chatId, "خطا در دریافت اطلاعات،با پشتیبانی تماس بگیرین😫");
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
            bot.sendMessage(chatId, "دریافت لینک با خطا روبرو شد با پشتیبانی تماس بگیرین😫");
            return false;
        } else {
            links = movie.link;
        }
    }

    sendMovie(bot, chatId, movie, links, user);
}


exports.welcome = async function (bot, msg, chatId) {
    userController.findOrCreate(msg.from);
    bot.sendMessage(
        chatId,
        `👋 سلام ${msg.from.first_name}\nبه ربات کامواچ خوش اومدی🎉\nمیتونی بین 20 هزارتا فیلم موجود در ربات جستجو کنی و ازش رایگان استفاده کنی🤩🤩\nفعلا فقط فیلم داریم و به زودی سریال ها و یه عالمه امکانات دیگه رو هم اضافه میکنیم😎\nاسم فیلم موردنظرت رو بنویس تا لینکش رو برات بفرستیم...`
    );
}


exports.arabicInput = async function (bot, msg, chatId) {
    await Log.create({
        value: msg.text,
        type: "persian_search",
    })
    bot.sendMessage(chatId, "⚠لطفا از حروف فارسی استفاده نکنید\nربات فقط دارای آرشیو فیلم خارجی می باشد\nبرای جستجو نام فیلم را به انگلیسی وارد کنید برای مثال: Fight Club")
}