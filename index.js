express = require('express')
app = express()
scraper = require('./scraper')
bodyParser = require('body-parser');

app.use(express.static('static'))
app.use(bodyParser())

app.post('/ical', function (req, res) {
    scraper.getPage(req.body.userid, req.body.pwd).then(function(body) {
        return scraper.parseStr(req.body.userid, body).then(function(r) {
            res.header("Content-Type", "text/calendar")
            res.send(r)
        })
    }).catch(function (err) {
        res.send("error")
    })
})

app.listen(process.env.PORT || 8000, function () {
  console.log('Example app listening on port 80!')
})
