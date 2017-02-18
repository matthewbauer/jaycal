express = require('express')
app = express()
scraper = require('./scraper')
bodyParser = require('body-parser');

app.use(express.static('static'))
app.use(bodyParser())

app.get('/ical', function (req, res) {
    ical(req, res)
})

app.post('/ical', function (req, res) {
    ical(req, res)
})

function ical (req, res) {
    userid = req.body.userid || req.query.userid
    pwd = req.body.pwd || req.query.pwd
    scraper.getPage(userid, pwd).then(function(body) {
        return scraper.parseStr(req.body.userid, body).then(function(r) {
            res.header("Content-Type", "text/calendar")
            res.send(r)
        })
    }).catch(function (err) {
        res.status(500)
        res.send("error")
        console.log(err)
    })
}

port = process.env.PORT || 8000
app.listen(port, function () {
  console.log('Example app listening on port ' + port)
})
