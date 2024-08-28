const yearRegex = /((20|19)[0-9]{2})/g;

const helpers = {
    getYearRegex() {
        return yearRegex;
    },
    getYearFromMovieName(movieName) {
        let year = movieName.match(yearRegex);
        return year instanceof Array ? year[0] : '';
    },

    getMovieExt(name) {
        let splitted = name.split('.');

        if (this.isDirectory(name) || splitted.length === 0) {
            return "";
        }

        return splitted[splitted.length - 1]
    },

    isValidExt(name) {
        let ext = this.getMovieExt(name);

        return ['mkv', 'mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext);

    },

    isDirectory(name) {
        return name[name.length - 1] === '/';
    },

    parseMovieName(name, year) {
        let nameRegex = new RegExp('^(.+?)' + year, 'g');
        let nameParsed = name.match(nameRegex) || {};
        nameParsed = nameParsed[Object.keys(nameParsed)[0]] || name;
        if (nameParsed.length <= 2) {
            nameParsed = name;
        }
        nameParsed = nameParsed
            .replace('.mp4', '')
            .replace('.mkv', '')
            .replace('.avi', '')
            .replace(/\./g, ' ')
            .replace(/_/g, ' ')
            .replace(/\(/g, ' ')
            .replace(/\)/g, ' ')
            .replace(/  +/g, ' ')

        return nameParsed;
    },
    bytesToSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        if (bytes === 0) return 'n/a'
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
        if (i === 0) return `${bytes} ${sizes[i]})`
        return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
    },
    isDubbed(name) {
        return name.includes('Dubbed') ||
            name.includes('dubbed') ||
            name.includes('Dub') ||
            name.includes('Duble') ||
            name.includes('DUBBED')
    },
    isSansored(name) {
        return name.includes('sansor') ||
            name.includes('censored') ||
            name.includes('Sansor')
    },
    getQuality(link) {
        let qualities = ['720p', '1080p', '480p', 'DVDRip']

        let q = null;
        qualities.forEach(quality => {
            if (q !== null) {
                return false;
            }

            if (link.includes(quality)) {
                q = quality;
            }
        })

        if (link.includes('3D')) {
            q += " " + "3D"
        }

        if (link.includes('x265')) {
            q += " " + "x265"
        }


        return q;
    },
    getRelease(link) {
        let releases = [
            'Bluray',
            'BLURAY',
            'bluray',
            'blue-ray',
            'Web-Dl',
            'Web-DL',
            'DivX',
            'DVBRip',
            'WEB DL',
            'WEBRip',
            'WEB Rip',
            'HC',
            'BluRay',
            'WEB-DL',
            'WebDL',
            'webdl',
            'web-dl',
            'HEVC',
            'DVDRip',
            'hdcam',
            'HDCAM',
            'HD-CAM',
            'hd-cam',
            'hevc',
            'HDCam',
            'hdcam',
            'HDRip',
            'hdrip',
            'REMUX',
            'Remux',
            'HDTV',
            'hdtv',
            'BrRip',
            'HDCAM'
        ]

        let r = null;
        releases.forEach(release => {
            if (r !== null) {
                return false;
            }

            if (link.includes(release)) {
                r = release;
            }
        })

        return r;
    },

    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    searchMovieDB(name, year = null) {
        const MovieDB = require('moviedb')('6f0c625e9b7f81e80f475be102f64bfc');
        return new Promise((resolve, reject) => {
            let query = {
                query: name
            };


            if (year !== null) {
                query = {
                    query: name,
                    year: year,
                }
            }


            MovieDB.searchMovie(query, (err, res) => {
                resolve(res);
            });
        })
    },
    getSize(link) {
        link = link.match(/([0-9]+( |.[0-9]+)(mb|gb|kb|Bytes))/i)
        return link && link.length >= 1 ? link[0] : null;
    },
    generateCaption(movie, links) {
        let caption = `${movie.name}\n`;

        if (movie.imdb !== null && movie.imdb !== undefined) {
            caption += ` ⭐IMDB: ${movie.imdb}\n`;
        }

        if (movie.description !== null && movie.description !== undefined) {
            caption += '\n';
            caption += ` ✍خلاصه داستان: ${movie.description}\n\n`;
        }


        links.forEach(li => {
            caption += `📎 لینک دانلود: <a href="${li.link}">دانلود ${(li.quality || "") + " " + (li.release || "")}  ${li.size || ""} ${li.dubbed ? "Dubbed" : ""} ${li.censored ? "Censored" : ""}</a>\n`
        })


        caption += `ربات دانلود رایگان مستقیم فیلم و سریال\n@comewatch_bot`;

        return caption;
    },
    escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    },
    removeSpaces(text) {
        return text.replace(/ +/g, '');
    }
};


module.exports = helpers;