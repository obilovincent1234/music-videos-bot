const mongoose = require('mongoose');
const axios = require('axios'); // Replace request with axios
const cheerio = require('cheerio');
require('dotenv').config({ path: './../.env' });

// Models
const Search = require('./../models/Search');
const Movie = require('./../models/Movie');
const Log = require('./../models/Log');

const mongoURI = "MONGO_URI=mongodb+srv://your_username:your_password@cluster0.cen1xf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Database connection
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin'
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected');
    findCovers();
});

// Find covers function
const findCovers = async function () {
    try {
        let movies = await Movie.find({ cover: null }).limit(10); // Increase limit if needed

        console.log(`Movies in DB => ${movies.length}`);

        for (let movie of movies) {
            let movieName = movie.name.replace(/((20|19)[0-9]{2})/g, '');
            let url = encodeURI(`https://www.imdb.com/search/title/?title=${movieName}&title_type=feature,tv_movie,tv_series,short&adult=include&view=simple`);
            
            try {
                const { data } = await axios.get(url);
                const $ = cheerio.load(data);
                
                if ($('.mode-simple').length === 0) {
                    console.log(`No result for: @${movieName}@`);
                    continue;
                }
                
                let src = $('.mode-simple').eq(0).find('.lister-item-image').find('img').attr('src');
                console.log(`Found ${movieName} => ${src}`);

                // You can update the movie with the cover here if needed
                await Movie.updateOne({ _id: movie._id }, { cover: src });
                
            } catch (error) {
                console.error(`Error fetching cover for: ${movieName}`, error);
            }
        }

    } catch (error) {
        console.error('Error finding covers:', error);
    }
};
