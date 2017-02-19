express = require('express')
app = express()
scraper = require('./scraper')
bodyParser = require('body-parser')
cookieParser = require('cookie-parser')
redis = require("redis")

client = redis.createClient(process.env.REDIS_URL || 6379);

client.on("error", function (err) {
    console.log("Error " + err);
})

app.use(express.static('static'))
app.use(bodyParser())
app.use(cookieParser())

/* At the top, with other redirect methods before other routes */
if (process.env.PORT)
    app.get('*',function(req,res,next){
        if(req.headers['x-forwarded-proto']!='https')
            res.redirect('https://jaycal.herokuapp.com'+req.url)
        else
            next() /* Continue to other routes if we're not redirecting */
    })

app.get('/schedule.ics', function (req, res) {
    userid = req.body.userid || req.query.userid || req.cookies["userid"]
    pwd = req.body.pwd || req.query.pwd || req.cookies["pwd"]
    key = userid + pwd + "2"
    client.get(key, function (userid, pwd, key, err, reply) {
        if (reply != null) {
            res.header("Content-Type", "text/calendar")
            res.send(reply)
        } else {
            scraper.getPage(userid, pwd).then(function(userid, key, body) {
                return scraper.parseStr(userid, body).then(function(key, r) {
                    client.set(key, r)
                    res.header("Content-Type", "text/calendar")
                    res.send(r)
                }.bind(this, key))
            }.bind(this, userid, key)).catch(function (err) {
                res.status(500)
                res.send("error")
                console.log(err)
            })
        }
    }.bind(this, userid, pwd, key))
})

app.post('/calendar', function (req, res) {
    res.cookie("userid", req.body.userid)
    res.cookie("pwd", req.body.pwd)
    res.sendFile(__dirname + "/static/calendar.html")
})

app.get('/calendar', function (req, res) {
    res.sendFile(__dirname + "/static/calendar.html")
})

app.get('/dashboard', function (req, res) {
    if (!req.cookies["userid"] || req.cookies["userid"] == "") {
        res.redirect("/login")
        return
    }
    res.sendFile(__dirname + "/static/dashboard.html")
})

app.post('/dashboard', function (req, res) {
    res.cookie("userid", req.body.userid)
    res.cookie("pwd", req.body.pwd)
    res.sendFile(__dirname + "/static/dashboard.html")
})

app.get('/homeworks', function (req, res) {
    res.sendFile(__dirname + "/static/calendar_hw.html")
})

app.get('/events', function (req, res) {
    res.sendFile(__dirname + "/static/calendar_events.html")
})

app.get('/logout', function (req, res) {
    res.cookie("userid", "")
    res.cookie("pwd", "")
    res.redirect("/login")
})

app.get('/login', function (req, res) {
    res.sendFile(__dirname + "/static/login.html")
})

app.get('/', function (req, res) {
    if (!req.cookies["userid"] || req.cookies["userid"] == "")
        res.redirect("/login")
    else
        res.redirect("/dashboard")
})

port = process.env.PORT || 8000
app.listen(port, function () {
  console.log('Example app listening on port ' + port)
})
