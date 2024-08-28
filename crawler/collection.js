var cheerio = require('cheerio')
var helper = require('../helpers/helpers')
var rp = require('request-promise')
var fs = require('fs')
var source = ''

async function crawl() {
    try {
        var page = await rp(source)
        var $ = cheerio.load(page)
        $('tr').each(async item => {
            try {

                // } 
                var movieParent = $('tr').eq(item).find('a').text();

                if (movieParent != '6 - TV Shows/' && movieParent != '3 - Documentaries/' && movieParent != '2 - New Movies/' && movieParent != '1 - Series & Sagas/' && movieParent != 'Parent Directory' && movieParent != 'NameLast modifiedSizeDescription' && movieParent != ' ' && movieParent != undefined) {
                    var moviePage = await rp(source + movieParent)
                    var pageData = cheerio.load(moviePage)
                    pageData('tr').each(async i => {
                        var name = pageData('tr').eq(i).find('a').text();
                        if (helper.isValidExt(name)) {
                            var link = pageData('tr').eq(i).find('a').attr('href');
                            var year = helper.getYearFromMovieName(name)
                            var quality = helper.getQuality(name)
                            var release = helper.getRelease(name)
                            var parsedName = helper.parseMovieName(name, year)
                            var dlLink = source +movieParent +link
                            var file =await rp.head(dlLink)
                            var size =file['content-length']
                            var result ={
                                name:parsedName,
                                year:year,
                                link:{
                                    link:dlLink,
                                    size:helper.bytesToSize(size),
                                    release:release,
                                    quality:quality,
                                    dubbed:helper.isDubbed(name),
                                    censored:helper.isSansored(name)
                                }
                            }
                            fs.appendFileSync('../bin/collection.json',JSON.stringify(result)+',')
                        }



                    })

                }
            } catch (e) {

            }

        })
    } catch (e) {
        console.log(e.message)
    }
}
crawl()
