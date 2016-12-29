console.log('server is running now')

var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

function getRelated(artistId) {
    var emitter = new events.EventEmitter()
    unirest.get('https://api.spotify.com/v1/artists/' + artistId + '/related-artists')
    .end(function(response) {
        if (response.ok) {
            emitter.emit('end', response.body)
//            console.log(response.body.artists)
        }
        else {
            emitter.emit('error', response.code)
        }
    })
    return emitter
}

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        var id = item.artists.items[0].id
        var relatedArtists = getRelated(id)

        relatedArtists.on('end', function(item) {
            artist.related = item.artists
        })

        relatedArtists.on('error', function (code) {
            res.sendStatus(code);
        });

        res.json(artist);
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});



app.listen(process.env.PORT || 8080);