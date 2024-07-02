# movies_scraper.py

import requests
from bs4 import BeautifulSoup

# Function to search for movies
def search_movies(query):
    movies_list = []
    url = f"https://musicstudio.com.ng/search?q={query}"
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        results = soup.find_all('div', class_='movie-item')

        for result in results:
            title = result.find('h2', class_='title').text.strip()
            link = result.find('a')['href']
            movies_list.append({"title": title, "link": link})

    return movies_list

# Function to get movie details
def get_movie(movie_id):
    movie_details = {}
    url = f"https://musicstudio.com.ng/movie/{movie_id}"
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        title = soup.find('h1', class_='movie-title').text.strip()
        img_url = soup.find('img', class_='movie-img')['src']
        download_links = soup.find('div', class_='download-links').find_all('a')

        links = {}
        for link in download_links:
            links[link.text.strip()] = link['href']

        movie_details = {"title": title, "img": img_url, "links": links}

    return movie_details
