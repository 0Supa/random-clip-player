const express = require('express')
const app = express()
const utils = require('./utils.js')

app.set('view engine', 'ejs');

app.get('/rcp/:channel', async (req, res) => {
    const channel = req.params.channel
    if (!channel) return res.status(400).send('You need to specify the channel name')

    const user = (await utils.helix(`users?login=${channel}`)).body.data
    if (!user.length) return res.status(400).send('Invalid channel name')

    let clips
    const cacheData = await utils.redis.get(`rc:clips:${user[0].id}`)
    if (cacheData) {
        clips = JSON.parse(cacheData)
    } else {
        const data = (await utils.helix(`clips?broadcaster_id=${user[0].id}&first=100`)).body.data
        if (data.length < 5) return res.status(404).send('The channel needs to have at least 5 clips')

        clips = data.map(clip => /twitch\.tv\/(.*)-preview-480x272.jpg/.exec(clip.thumbnail_url)[1])
        await utils.redis.set(`rc:clips:${user[0].id}`, JSON.stringify(clips), "EX", 86400)
    }

    res.render('index', { clips })
})

app.listen(3840, (err) => {
    if (err) throw err
    console.log(`listening on 3840`)
})
