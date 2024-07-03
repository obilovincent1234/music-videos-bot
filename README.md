Movie Recommender Bot
Introduction
Movie Recommender Bot is a Telegram bot that provides personalized movie recommendations to users based on their preferences and search history. It leverages the TMDb API to access movie data and utilizes Python, the Telegram library, SQLite, and other technologies to deliver a seamless user experience.

Features
Personalized movie recommendations: Recommends movies to users based on their choices and search history.
Movie ratings: Provides information about the ratings of movies.
Upcoming movies: Allows users to explore upcoming movie releases.
Most watched movies: Displays a list of the most watched movies by users.
Installation
Clone the repository:
bash
Copy code
git clone https://github.com/your-username/movie-recommender-bot.git
Navigate to the project directory:
bash
Copy code
cd movie-recommender-bot
Install dependencies:
Copy code
pip install -r requirements.txt
Set up the SQLite database:
Copy code
python setup_db.py
Obtain API keys:
Register an account on The Movie Database (TMDb) website.
Generate an API key from your TMDb account dashboard.
Configure the bot:
Rename the config.sample.py file to config.py.
Replace the placeholder values in config.py with your TMDb API key and Telegram bot token.
Start the bot:
Copy code
python bot.py
Usage
Start the bot by searching for it in Telegram and clicking "Start".
Use the available commands to interact with the bot:
/recommend: Get personalized movie recommendations based on your preferences.
/ratings: Get information about movie ratings.
/upcoming: Explore upcoming movie releases.
/most_watched: Discover the most watched movies by users.
Follow the prompts and interact with the bot to receive movie recommendations and explore other features.
File Structure
bash
Copy code
movie-recommender-bot/
├── bot.py                    # Main bot script
├── config.sample.py          # Sample configuration file (rename to config.py)
├── db.sqlite                 # SQLite database file
├── requirements.txt          # List of Python dependencies
├── setup_db.py               # Script to set up SQLite database
└── README.md                 # Project README file
Contributing
Contributions to Movie Recommender Bot are welcome! To contribute:

Fork the repository
Create your feature branch (git checkout -b feature/my-feature)
Commit your changes (git commit -am 'Add new feature')
Push to the branch (git push origin feature/my-feature)
Create a new Pull Request
License
This project is licensed under the MIT License. See the LICENSE file for details.

Credits
The Movie Database (TMDb) API: Provides access to movie data.
Python Telegram Bot: Library for creating Telegram bots in Python.
Contact
For questions or feedback, please contact avivsalem95@gmail.com.
