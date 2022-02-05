const config = require('./config.json')
const Redis = require("ioredis");

const redis = new Redis();
const got = require('got');

module.exports = {
    helix: got.extend({
        prefixUrl: 'https://api.twitch.tv/helix',
        throwHttpErrors: false,
        responseType: 'json',
        headers: {
            'Client-ID': config.clientId,
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
        }
    }),
    redis
}
