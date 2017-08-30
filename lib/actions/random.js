'use strict';

const libraryDef = require('../music_services/libraryDef');
const logger = require('sonos-discovery/lib/helpers/logger');
const random = require('random-js')();

function playRandom(player, term) {
    term = decodeURIComponent(term);

    let albums = libraryDef.searchalbum(term);

    if (albums === null || Object.keys(albums).length === 0) {
        return Promise.resolve({
            status: 'not found'
        });
    }

    const queueURI = 'x-rincon-queue:' + player.coordinator.uuid + '#0';
    const numAlbums = Object.keys(albums).length;
    const randomAlbum = random.integer(0, numAlbums);
    const albumTracks = albums[Object.keys(albums)[randomAlbum]].sort((a, b) => {
        return parseInt(a.trackNumber) > parseInt(b.trackNumber)
    });

    logger.info("Add album '" + albumTracks[0].album + "' to queue");

    return player.coordinator.clearQueue()
        .then(() => {
            queueTracks(player, albumTracks, () => {
                player.coordinator.setAVTransport(queueURI, '').then(() => {
                    player.coordinator.play();
                })
            });
        });
}

function queueTracks(player, tracks, callback) {
    if (tracks === null || tracks.length === 0) {
        callback();
        return;
    }

    player.coordinator.addURIToQueue(tracks[0].uri, tracks[0].metadata)
        .then(() => {
            logger.debug("Added to queue: " + tracks[0].trackNumber);
            queueTracks(player, tracks.slice(1, tracks.length), callback);
        });
}

module.exports = function (api) {
    api.registerAction('random', playRandom);
};
