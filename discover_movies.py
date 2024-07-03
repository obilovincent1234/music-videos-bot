from collections import defaultdict, Counter
import requests
import db
from utils import *
from secret import TMDB_API_KEY
import networkx as nx

"""
A class for analyzing movies using The Movie Database (TMDb) API.

Attributes:
    genres_dict (dict): A dictionary mapping genre names to their corresponding IDs.

Methods:
    rate_movie(movie_name, rating):
        Rates a movie using the TMDB API.

    get_movies_by_options(option):
        Gets a list of movies based on a specified option.

    discover_movie(genre_name=None, release_year=None, actor_name=None, duration=None):
        Discovers movies based on user-defined parameters.

    get_most_common_search_values(user_id):
        Retrieves the most common search values (genre, year, and duration) from a user's recent search history.
"""

genres_dict = create_genre_dictionary()

def rate_movie(movie_name, rating):

    """
        Rate a movie using the TMDB API.

        :param movie_name: The name of the movie to be rated.
        :param rating: The rating to be given to the movie (between 1 and 10).
    """

    # create a new guest session
    guest_session_request = requests.get(
        f"https://api.themoviedb.org/3/authentication/guest_session/new?api_key={TMDB_API_KEY}")

    # get the guest session id to pass it to the API post
    GUEST_SESSION_ID = guest_session_request.json()['guest_session_id']

    # get the movie's id from its name
    movie_id = get_movie_id(movie_name)

    rating_url = f'https://api.themoviedb.org/3/movie/{movie_id}/rating'

    headers = {
        'Content-Type': 'application/json;charset=utf-8'
    }

    rating = {
        'value': rating
    }

    params = {
        'api_key': TMDB_API_KEY,
        'guest_session_id': GUEST_SESSION_ID
    }

    # rate the movie with headers as required
    rate_response = requests.post(rating_url, headers=headers, json=rating, params=params)

    if (rate_response.status_code == 200):
        print(f"Movie {movie_name} was rated {rating['value']} successfully!")


def get_movies_by_options(option):

    """
        Get a list of movies based on a specified option.

        :param option: The option for fetching movies (e.g., 'top_rated', 'upcoming').
        :return: A list of movie names.
        """

    response = requests.get(f"https://api.themoviedb.org/3/movie/{option}?api_key={TMDB_API_KEY}&language=en-US")
    movies = response.json()['results']

    genre_dict = {v: k for k, v in genres_dict.items()}
    movies_list = []
    i = 0
    while i < 20:
        if(movies[i]['original_language'] == 'en'):
            genre_names = ', '.join([genre_dict.get(category) for category in movies[i]['genre_ids'] if category in genre_dict])
            film_id = movies[i]['id']
            film_runtime = get_film_runtime(film_id)
            duration_formatted = f"{film_runtime // 60}h {film_runtime % 60}m"
            details_str = f"{movies[i]['original_title']} - \nGenres: {genre_names} - \nYear: {movies[i]['release_date'][:4]} - \nDuration: {duration_formatted}"

            movies_list.append(details_str)
        i += 1

    return movies_list


def discover_movie(genre_name=None, release_year=None, actor_name=None, duration=None):
    total_films_added = 0
    NUMBER_OF_FILMS_TO_ADD = 10

    DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie"

    actor_id = get_actor_id(actor_name) if actor_name is not None else None
    genre_id = genres_dict.get(genre_name) if genre_name is not None else None

    exact_match_movies = []  # Store movies with exact match parameters
    actor_related_movies = []  # Store movies with same actor as specified

    # First, gather movies with exact match parameters
    page = 1
    while total_films_added < NUMBER_OF_FILMS_TO_ADD and page <= 50:  # Adjusted the page limit

        params = {
            "api_key": TMDB_API_KEY,
            "primary_release_year": release_year,
            "with_genres": genre_id,
            "with_cast": actor_id,
            "sort_by": "popularity.desc",
            "include_adult": False,
            "include_video": False,
            "runtime.gte": duration,
            "page": page
        }

        response = requests.get(DISCOVER_URL, params=params)

        if response.status_code == 200:
            movies = response.json()["results"]
            for movie in movies:
                if total_films_added >= NUMBER_OF_FILMS_TO_ADD:
                    break

                exact_match_movies.append(movie)
                total_films_added += 1

        else:
            print(f"Error fetching data from API - {response.status_code}")
            print(response.text)
            break

        page += 1

    # If we still don't have enough movies, gather movies with the same actor
    if total_films_added < NUMBER_OF_FILMS_TO_ADD and actor_name:
        page = 1  # Reset the page for actor-related movies
        params = {
            "api_key": TMDB_API_KEY,
            "with_cast": actor_id,
            "sort_by": "popularity.desc",
            "include_adult": False,
            "include_video": False,
            "page": page
        }

        response = requests.get(DISCOVER_URL, params=params)

        if response.status_code == 200:
            movies = response.json()["results"]
            for movie in movies:
                if total_films_added >= NUMBER_OF_FILMS_TO_ADD:
                    break

                actor_related_movies.append(movie)
                total_films_added += 1

        else:
            print(f"Error fetching data from API - {response.status_code}")
            print(response.text)

    # Calculate distances based on release year and duration
    distance_movies = exact_match_movies + actor_related_movies
    movie_distance = defaultdict(list)
    target_params = (release_year, duration)

    for movie in distance_movies:
        movie_release_year = int(movie['release_date'][:4])
        movie_duration = get_film_runtime(get_movie_id(movie['title']))
        distance = abs(target_params[0] - movie_release_year) + abs(target_params[1] - movie_duration)
        movie_distance[distance].append(movie)
    filmGraph = nx.Graph()
    # If we still don't have enough movies, gather movies based on distance
    if total_films_added < NUMBER_OF_FILMS_TO_ADD:
        sorted_distances = sorted(movie_distance.keys())
        for distance in sorted_distances:
            if total_films_added >= NUMBER_OF_FILMS_TO_ADD:
                break

            for movie in movie_distance[distance]:
                film_id = get_movie_id(movie['title'])
                film_runtime = get_film_runtime(film_id)
                movie_release_year = int(movie['release_date'][:4])

                filmGraph.add_node(
                    movie['title'],
                    category=movie['genre_ids'],
                    release_year=movie_release_year,
                    duration=film_runtime,
                    actor=get_film_actors(film_id)
                )

                total_films_added += 1

    # Create a graph and add nodes based on gathered movies

    for movie in exact_match_movies + actor_related_movies:
        film_id = get_movie_id(movie['title'])
        film_runtime = get_film_runtime(film_id)
        movie_release_year = int(movie['release_date'][:4])

        filmGraph.add_node(
            movie['title'],
            category=movie['genre_ids'],
            release_year=movie_release_year,
            duration=film_runtime,
            actor=get_film_actors(film_id)
        )

    return filmGraph




def get_most_common_search_values(user_id):
    """
    Retrieves the most common search values (genre, year, and duration) from a user's recent search history.

    Args:
        user_id (int): The ID of the user.

    Returns:
        list: A list containing the most common genre, year, and duration values from the user's recent searches.
    """

    # Retrieve the user's recent search history
    history = db.get_user_recent_searches(user_id)

    # Initialize lists to store genres, years, and durations
    genres, years, durations = [], [], []

    # Extract genres, years, and durations from the history
    for i in range(len(history)):
        genres.append(history[i][0])
        years.append(history[i][1])
        durations.append(history[i][2])

    # Count occurrences of each genre, year, and duration
    genres_count = Counter(genres)
    years_count = Counter(years)
    duration_count = Counter(durations)

    # Get the most common values for genre, year, and duration
    most_common_genre = genres_count.most_common(1)[0][0]
    most_common_year = years_count.most_common(1)[0][0]
    most_common_duration = duration_count.most_common(1)[0][0]

    # Create a list containing the most common values
    return_values = [most_common_genre, most_common_year, most_common_duration]

    return return_values