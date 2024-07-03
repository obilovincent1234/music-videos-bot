import io
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from discover_movies import *
from secret import TMDB_API_KEY
from telegram import Update
from telegram.ext import ContextTypes

user_preferences = {}
genres_dict = create_genre_dictionary()


async def inline_button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    This asynchronous method is a callback handler for inline keyboard button presses in a Telegram bot.

    Args:
        update (telegram.Update): The update containing the callback query.
        context (telegram.ext.ContextTypes.DEFAULT_TYPE): The context for the callback.

    Returns:
        None
    """

    query = update.callback_query

    await query.answer()  # Await the answer() function to properly remove the "loading" icon

    option = query.data

    if option == "upcoming":
        # Handle the "upcoming" option by fetching upcoming movies and sending their posters and details.

        upcoming_movies = get_movies_by_options('upcoming')
        for movie in upcoming_movies:
            movie_title = movie.split(" - ")[0]
            poster_url = get_movie_image_url(TMDB_API_KEY, movie_title)
            response = requests.get(poster_url)
            image = io.BytesIO(response.content)
            image.name = "movie_poster.jpg"
            await query.message.reply_photo(photo=image, caption=movie)

    elif option == "recommendation":
        # Handle the "recommendation" option by generating and sending movie recommendations based on user preferences.

        recommendations_text = "I made a list of movies that I think you will like:\n\n"
        search_values = get_most_common_search_values(query.message.chat.id)
        movies = discover_movie(search_values[0], search_values[1], None, search_values[2])
        genre_dict = {v: k for k, v in genres_dict.items()}
        await query.message.reply_text(recommendations_text)
        
        if movies:
            for movie in movies.nodes(data=True):
                title = movie[0]
                details = movie[1]
                release_year = details.get('release_year', 'Unknown')
                duration = details.get('duration', 'Unknown')
                genre_names = ', '.join(
                    [genre_dict.get(category) for category in details['category'] if category in genre_dict])

                actors = ', '.join(details['actor'])
                poster_url = get_movie_image_url(TMDB_API_KEY, title)
                response = requests.get(poster_url)
                image = io.BytesIO(response.content)
                image.name = "movie_poster.jpg"

                details_str = f"Release Year: {release_year}\nDuration: {duration}\nGenres: {genre_names}\nActors: {actors}"
                await query.message.reply_photo(photo=image, caption=details_str)

        else:
            await query.message.reply_text("I'm sorry, I couldn't generate any recommendations for you at the moment.")

    elif option == "ratemovies":
        # Handle the "ratemovies" option by prompting the user to input a movie name for rating.

        await query.message.reply_text("What's the name of the movie you want to rate?")
        context.user_data['rating_movie_name'] = True
        context.user_data.pop('rating_movie_number_input', None)

    elif option == "searchmovie":
        # Handle the "searchmovie" option by prompting the user to start a movie search.

        await query.message.reply_text("Type movie to start the search!")

    elif option == "topmovies":
        # Handle the "topmovies" option by fetching top-rated movies and sending their posters and details.

        top_rated_movies = get_movies_by_options('top_rated')
        for movie in top_rated_movies:
            movie_title = movie.split(" - ")[0]
            poster_url = get_movie_image_url(TMDB_API_KEY, movie_title)
            response = requests.get(poster_url)
            image = io.BytesIO(response.content)
            image.name = "movie_poster.jpg"
            await query.message.reply_photo(photo=image, caption=movie)

    elif option == 'randommovies':
        # Handle the "randommovies" option by fetching random movies and sending their posters and details.

        genre_dict = {v: k for k, v in genres_dict.items()}
        movies = discover_movie(None, 2023, None, 120)
        if movies:
            for movie in movies.nodes(data=True):
                title = movie[0]
                details = movie[1]
                release_year = details.get('release_year', 'Unknown')
                duration = details.get('duration', 'Unknown')
                genre_names = ', '.join(
                    [genre_dict.get(category) for category in details['category'] if category in genre_dict])

                actors = ', '.join(details['actor'])
                poster_url = get_movie_image_url(TMDB_API_KEY, title)
                response = requests.get(poster_url)
                image = io.BytesIO(response.content)
                image.name = "movie_poster.jpg"

                details_str = f"Release Year: {release_year}\nDuration: {duration}\nGenres: {genre_names}\nActors: {actors}"
                await query.message.reply_photo(photo=image, caption=details_str)
        else:
            response = 'No movies found.'

    elif option == "history":
        # Handle the "history" option by fetching and sending the user's recent search history.

        history = db.get_user_recent_searches(query.message.chat.id)
        history_search_list = []
        for i in range(len(history)):
            search = f"#{i+1} Genre: {history[i][0]} || Year: {history[i][1]} || Duration: {history[i][2]}"
            await query.message.reply_text(search)
            history_search_list.append(search)




async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    This asynchronous method handles the /start command by sending a welcome message
    and presenting the user with an inline keyboard for various bot functionalities.

    Args:
        update (telegram.Update): The update containing the /start command message.
        context (telegram.ext.ContextTypes.DEFAULT_TYPE): The context for the command.

    Returns:
        None
    """

    keyboard = [
        [InlineKeyboardButton("⏳ Upcoming", callback_data="upcoming")],
        [InlineKeyboardButton("🔝 Top Movies", callback_data="topmovies")],
        [InlineKeyboardButton("🕒 History", callback_data="history")],
        [InlineKeyboardButton("🎲 Random Movies", callback_data="randommovies")],
        [InlineKeyboardButton("⭐ Rate Movies", callback_data="ratemovies")],
        [InlineKeyboardButton("🔍 Search Movie", callback_data="searchmovie")],
        [InlineKeyboardButton("🎬 Recommendation", callback_data="recommendation")]
    ]

    # Use the modified keyboard to create the reply_markup
    reply_markup = InlineKeyboardMarkup(keyboard)
    image_url = 'https://user-images.githubusercontent.com/86877457/132905471-3ef27af4-ecc6-44bf-a47c-5ccf2250410c.jpg'
    response = requests.get(image_url)

    if response.status_code == 200:
        image = io.BytesIO(response.content)
        image.name = "movie_poster.jpg"
    await update.message.reply_photo(photo=image, caption="Welcome to MovieMatchBot!\n"
        "I'm here to help you discover the perfect movies for you.\n"
        "Explore upcoming movies, find top-rated films, get recommendations, and more!\n"
        "Simply use the options below to get started.",reply_markup=reply_markup)



async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Sure, I'm here to help!\n"
        "If you're looking for movie recommendations, you can use these commands:\n"
        "- /start: Start a new interaction with the bot.\n"
        "- /about: Learn more about me and my movie matching capabilities.\n"
        "- /help: Get assistance on how to use the bot.\n"
        "Simply type 'movie' and follow the prompts to provide preferences for discovering movies."
    )


async def About_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Hello, I'm a movie matching bot!\n"
        "My goal is to help you find movies that suit your preferences.\n"
        "You can input your preferences for genre, release year, duration, and actor.\n"
        "To get started, simply type 'movie' and follow the prompts to provide your preferences."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    This asynchronous method handles incoming text messages in the Telegram bot by processing user interactions,
    managing user preferences for movie searches, and performing various actions based on the message content.

    Args:
        update (telegram.Update): The update containing the incoming message.
        context (telegram.ext.ContextTypes.DEFAULT_TYPE): The context for the message.

    Returns:
        None
    """

    message_type: str = update.message.chat.type
    text: str = update.message.text
    if not text:  # Check if the message text is empty
        return
    response = ''  # Initialize the response variable
    if context.user_data.get('rating_movie_name'):  # Handling movie rating inputs

        # User entered a movie name
        movie_name = update.message.text
        context.user_data['rating_movie_name'] = False  # Reset the flag
        context.user_data['rating_movie_name_input'] = movie_name
        # Save the movie name
        await update.message.reply_text("Type a number between 1 and 10 to rate this movie.")

    elif context.user_data.get('rating_movie_name_input'):
        # User entered a rating
        rating = update.message.text

        # Here you can add validation to ensure the rating is a number between 1 and 10
        if rating.isdigit() and 1 <= int(rating) <= 10:
            # Clear the saved input
            await update.message.reply_text(
                f"You rated '{context.user_data['rating_movie_name_input']}' with a rating of {rating}.")
            rate_movie(context.user_data['rating_movie_name_input'], float(rating))
            context.user_data['rating_movie_name_input'] = False

        else:
            await update.message.reply_text("Please provide a valid rating between 1 and 10.")

        # Clear the saved data
    if message_type == 'private':
        user_id = update.message.chat.id
        user_pref = user_preferences.get(user_id, {})

        if text.lower() == 'movie':
            user_pref['movie_search'] = 'genre'
            user_preferences[user_id] = user_pref
            await update.message.reply_text('Please enter the genre of the movie:')

        elif user_pref.get('movie_search'):
            search_step = user_pref['movie_search']
            if search_step == 'genre':
                user_pref['genre'] = text
                user_pref['movie_search'] = 'year'
                await update.message.reply_text('Please enter the release year:')

            elif search_step == 'year':
                user_pref['year'] = text
                user_pref['movie_search'] = 'duration'
                await update.message.reply_text('Please enter the duration (in minutes):')

            elif search_step == 'duration':

                try:

                    duration_minutes = int(text)  # Convert the input to an integer

                    user_pref['duration'] = duration_minutes

                    user_pref['movie_search'] = 'actor'

                    await update.message.reply_text('Please enter the actor:')

                except ValueError:

                    await update.message.reply_text('Invalid duration. Please enter a valid number of minutes.')

            elif search_step == 'actor':
                user_pref['actor'] = text
                user_pref.pop('movie_search')  # Clear movie search step
                user_preferences[user_id] = user_pref

                # Fetch movies based on user preferences
                genre_name = user_pref['genre']
                release_year = int(user_pref['year'])
                duration = int(user_pref['duration'])
                actor_name = user_pref['actor']

                if (not db.db_user_exists(user_id)):
                    db.db_add_user(user_id)

                # Fetch movies and their image URLs
                genre_dict = {v: k for k, v in genres_dict.items()}
                movies = discover_movie(genre_name, release_year, actor_name, duration)
                if movies:
                    for movie in movies.nodes(data=True):
                        title = movie[0]
                        details = movie[1]
                        release_year = details.get('release_year', 'Unknown')
                        duration = details.get('duration', 'Unknown')
                        genre_names = ', '.join(
                            [genre_dict.get(category) for category in details['category'] if category in genre_dict])

                        actors = ', '.join(details['actor'])
                        poster_url = get_movie_image_url(TMDB_API_KEY, title)
                        response = requests.get(poster_url)
                        image = io.BytesIO(response.content)
                        image.name = "movie_poster.jpg"

                        details_str = f"Release Year: {release_year}\nDuration: {duration}\nGenres: {genre_names}\nActors: {actors}"
                        await update.message.reply_photo(photo=image, caption=details_str)
                else:
                    response = 'No movies found.'

            else:
                response = 'I don\'t understand'

    # Reply normally if the message is in private
    print('Bot:', response)
    await update.message.reply_text(response)


# Log errors
async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f'Update {update} caused error {context.error}')
