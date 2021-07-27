const express = require('express')
const app = express()
const utils = require('./utils.js')

app.set('view engine', 'ejs');

app.use('/rcp/v2', express.static(__dirname + '/static'))

app.get('/rcp/api/clips/:channel', async (req, res) => {
    const channel = req.params.channel
    if (!channel) return res.status(400).json({ error: 'you need to specify the channel name' })

    const user = (await utils.helix(`users?login=${channel}`)).body.data
    if (!user.length) return res.status(400).json({ error: 'invalid channel name' })

    let clips
    const cacheData = await utils.redis.get(`rc:clips:${user[0].id}`)
    if (cacheData) {
        clips = JSON.parse(cacheData)
    } else {
        clips = await getClips(user[0].id, 3)
        if (clips.length < 5) return res.status(404).json({ error: 'the channel needs to have at least 5 clips' })

        await utils.redis.set(`rc:clips:${user[0].id}`, JSON.stringify(clips), "EX", 86400)
    }

    res.json(clips)
})

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
        clips = await getClips(user[0].id, 3)
        if (clips.length < 5) return res.status(404).send('The channel needs to have at least 5 clips')

        await utils.redis.set(`rc:clips:${user[0].id}`, JSON.stringify(clips), "EX", 86400)
    }

    res.render('index', { clips })
})

async function getClips(channelID, reqs) {
    let i = 0
    let clips = []
    let cursor

    while (i < reqs) {
        const { data, pagination } = (await utils.helix(`clips?broadcaster_id=${channelID}&first=100${cursor ? `&after=${cursor}` : ''}`)).body

        const l = data.length;
        for (let i = 0; i < l; i++) {
            const clip = data[i]
            clips.push({ by: clip.creator_name, id: /twitch\.tv\/(.*)-preview-480x272.jpg/.exec(clip.thumbnail_url)[1] })
        }

        cursor = pagination.cursor
        if (!cursor) { break; }
        i++
    }
    return clips;
}

app.listen(3840, (err) => {
    if (err) throw err
    console.log(`listening on 3840`)
})
