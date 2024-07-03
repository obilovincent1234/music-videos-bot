import requests
from secret import TMDB_API_KEY

"""
A wrapper class for interacting with The Movie Database 
(TMDb) API to retrieve movie and actor information.
"""


# method to get the ID of actor
def get_actor_id(actor_name):
    """
        Get the ID of an actor based on their name using The Movie Database (TMDb) API.
        Args:
            actor_name (str): The name of the actor.
        Returns:
            int: The actor's ID if found, otherwise None.
        """

    actor_response = requests.get(
        f"https://api.themoviedb.org/3/search/person?api_key={TMDB_API_KEY}&query={actor_name}")
    actor_data = actor_response.json()

    if actor_data['total_results'] == 0:
        print("No results found for that actor.")
        return
    else:
        actor_id = actor_data['results'][0]['id']
        return actor_id


# method to get the ID of a movie
def get_movie_id(movie_name):
    """
        Get the ID of a movie based on its name using The Movie Database (TMDb) API.
        Args:
            movie_name (str): The name of the movie.
        Returns:
            int: The movie's ID if found, otherwise None.
        """

    url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={movie_name}"
    response = requests.get(url)

    if (response.status_code == 200):
        data = response.json()

        if (data['total_results'] > 0):
            movie_id = data['results'][0]['id']
            return movie_id
        else:
            print(f"No movie found with the name {movie_name}")
    else:
        print(f"Error retrieving movie information.\nResponse status code: {response.status_code}")


# method to get a movie poster
def get_movie_image_url(api_key, movie_name):
    """
    Retrieve the image URL of a movie's poster using the TMDb (The Movie Database) API.

    Args:
        api_key (str): The API key for accessing the TMDb API.
        movie_name (str): The name of the movie for which to retrieve the poster image.

    Returns:
        Union[str, None]: The URL of the movie's poster image, or None if no image is found.
    """

    base_url = "https://api.themoviedb.org/3/search/movie"
    params = {
        "api_key": api_key,
        "query": movie_name
    }

    response = requests.get(base_url, params=params)
    data = response.json()

    if "results" in data and len(data["results"]) > 0:
        # Assuming the first result is the closest match
        movie_id = data["results"][0]["id"]

        # Get details of the movie
        movie_details_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
        params = {
            "api_key": api_key
        }

        movie_response = requests.get(movie_details_url, params=params)
        movie_data = movie_response.json()

        if "poster_path" in movie_data:
            image_url = f"https://image.tmdb.org/t/p/original{movie_data['poster_path']}"
            return image_url

    return None


def get_film_runtime(film_id):

    """
        Get the runtime of a film using its ID from The Movie Database (TMDb) API.
        Args:
            film_id (int): The ID of the film.
        Returns:
            int: The runtime of the film in minutes.
        """

    response = requests.get(f"https://api.themoviedb.org/3/movie/{film_id}?api_key={TMDB_API_KEY}&language=en-US")
    movie_details = response.json()
    runtime = movie_details['runtime']
    return runtime


def get_film_actors(film_id):

    """
    Get a list of top actors for a movie using data from The Movie Database (TMDb) API.

    Args:
        film_id (int): The ID of the movie for which to retrieve the cast.

    Returns:
        list: A list of actor names.
    """
        
    CAST_URL = f"https://api.themoviedb.org/3/movie/{film_id}/credits"

    params = {"api_key": TMDB_API_KEY}

    response = requests.get(CAST_URL, params=params)

    if response.status_code == 200:
        cast = response.json()["cast"]
        return [actor["name"] for actor in cast[:2]]

    return []


def create_genre_dictionary():

    """
    Create a dictionary of movie genres using data from The Movie Database (TMDb) API.

    Returns:
        dict: A dictionary mapping genre names to their corresponding IDs.
    """
        
    response = requests.get(f"https://api.themoviedb.org/3/genre/movie/list?api_key={TMDB_API_KEY}")
    genres = response.json()['genres']

    genres_dict = {genre["name"]: genre["id"] for genre in genres}
    return genres_dict
