const TelegramBot = require("node-telegram-bot-api");

const botService = require('../services/bot');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.on("message", async function (msg) {
    const chatId = msg.chat.id;

    if (msg.text.includes("/start")) {
        botService.welcome(bot, msg, chatId)
        return true;
    }

    if (msg.text.codePointAt(0) === "📥".codePointAt(0)) {
        botService.linkSelect(bot, msg, chatId)
        return true;
    }

    if (msg.text.codePointAt(0) === "🎥".codePointAt(0)) {
        botService.selectMovie(bot, msg, chatId)
        return true;
    }

    if (msg.text.codePointAt(0) === "🍿".codePointAt(0)) {
        botService.selectSeason(bot, msg, chatId)
        return true;
    }

    // if (/[\u0600-\u06FF]/.test(msg.text)) {
    //     botService.arabicInput(bot, msg, chatId);
    //     return false;
    // }


    botService.searchMovie(bot, msg, chatId);


});

exports.newMessage = function (req, res) {
    res.send({ok: true});
};
