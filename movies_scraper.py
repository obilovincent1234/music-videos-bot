# movies_scraper.py

import mysql.connector
import os

# Database connection configuration using environment variables
db_config = {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
}

def search_movies(query):
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor(dictionary=True)
    
    search_query = "SELECT id, title FROM movies WHERE title LIKE %s"
    cursor.execute(search_query, (f"%{query}%",))
    movies_list = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return movies_list

def get_movie(movie_id):
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor(dictionary=True)
    
    movie_query = "SELECT title, image_url, video_url FROM movies WHERE id = %s"
    cursor.execute(movie_query, (movie_id,))
    movie_details = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    return movie_details
