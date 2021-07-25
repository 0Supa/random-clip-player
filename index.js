const express = require('express')
const app = express()
const utils = require('./utils.js')

app.set('view engine', 'ejs');

app.get('/:channel', async (req, res) => {
    const channel = req.params.channel
    if (!channel) return res.status(400).send('You need to specify the channel name')

    const user = (await utils.helix(`users?login=${channel}`)).body.data
    if (!user.length) return res.status(400).send('Invalid channel name')

    const data = (await utils.helix(`clips?broadcaster_id=${user[0].id}&first=100`)).body.data
    if (!data.length) return res.status(404).send('This channel has no clips')

    const clips = data.map(clip => clip.thumbnail_url.replace(/-preview.*/, '.mp4'))

    res.render('index', { clips })
})

app.listen(3840, (err) => {
    if (err) throw err
    console.log(`listening on 3840`)
})
