const express = require('express')
const fs = require('fs')
const app = express()
const utils = require('./utils.js')

const getClips = async (channelID, reqs) => {
    let i = 0
    let clips = []
    let cursor

    if (channelID === '227322800') {
        const chimiClips = fs.readdirSync('./chimiClips').filter(file => file.endsWith('.mp4'));
        const l = chimiClips.length;
        for (let i = 0; i < l; i++) {
            const clip = chimiClips[i]
            clips.push({ kata: true, id: clip })
        }
    }

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

app.use('/rcp/overlay', express.static(__dirname + '/static'))

app.use('/rcp/chimiclips', express.static(__dirname + '/chimiClips'))

app.get('/rcp/api/clips/:channel', async (req, res) => {
    try {
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
    } catch (err) {
        res.sendStatus(500)
    }
})

app.listen(3840, (err) => {
    if (err) throw err
    console.log(`listening on 3840`)
})
