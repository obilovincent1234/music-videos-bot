# index.py

import os
import requests
from io import BytesIO
from flask import Flask, request
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CommandHandler, MessageHandler, Filters, CallbackQueryHandler, Dispatcher
from movies_scraper import search_movies, get_movie

# Telegram bot token
TOKEN = os.getenv("TOKEN")
URL = os.getenv("URL")  # Use environment variable for the URL
bot = Bot(TOKEN)

# Flask app initialization
app = Flask(__name__)

# Welcome message handler
def welcome(update, context):
    update.message.reply_text(f"Hello {update.message.from_user.first_name}, Welcome to AI Movies.\n"
                              f"🔥 Download Your Favourite Movies For 💯 Free And 🍿 Enjoy it.")
    update.message.reply_text("👇 Enter Movie Name 👇")

# Function to handle movie search
def find_movie(update, context):
    query = update.message.text
    movies_list = search_movies(query)
    if movies_list:
        keyboards = []
        for movie in movies_list:
            keyboard = InlineKeyboardButton(movie["title"], callback_data=movie["id"])
            keyboards.append([keyboard])
        reply_markup = InlineKeyboardMarkup(keyboards)
        update.message.reply_text('Search Results:', reply_markup=reply_markup)
    else:
        update.message.reply_text('Sorry 🙏, No Result Found!\nCheck If You Have Misspelled The Movie Name.')

# Function to handle movie result and download links
def movie_result(update, context):
    query = update.callback_query
    movie_id = query.data
    movie_data = get_movie(movie_id)

    response = requests.get(movie_data["image_url"])
    img = BytesIO(response.content)
    query.message.reply_photo(photo=img, caption=f"🎥 {movie_data['title']}")

    query.message.reply_text(f"Download Link: {movie_data['video_url']}")

# Set up dispatcher and handlers
def setup():
    dispatcher = Dispatcher(bot, None, use_context=True)
    dispatcher.add_handler(CommandHandler('start', welcome))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, find_movie))
    dispatcher.add_handler(CallbackQueryHandler(movie_result))
    return dispatcher

# Index route
@app.route('/')
def index():
    return 'Hello World! This is your movie bot.'

# Webhook route
@app.route('/{}'.format(TOKEN), methods=['POST'])
def webhook():
    update = Update.de_json(request.get_json(force=True), bot)
    setup().process_update(update)
    return 'ok'

# Set webhook route
@app.route('/setwebhook', methods=['GET', 'POST'])
def set_webhook():
    s = bot.set_webhook('{}/{}'.format(URL, TOKEN))
    if s:
        return "Webhook setup successful!"
    else:
        return "Webhook setup failed."

if __name__ == '__main__':
    app.run(debug=True)
