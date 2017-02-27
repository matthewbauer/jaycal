var express = require('express')
var app = express()
var scraper = require('./scraper')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var redis = require('redis')
var crypto = require('crypto')
var path = require('path')

var client = redis.createClient(process.env.REDIS_URL || 6379)

var redisConnected = false

client.on('error', function (err) {
})

client.on('ready', function () {
  redisConnected = true
})

app.use(express.static('static'))
app.use(bodyParser())
app.use(cookieParser())

/* At the top, with other redirect methods before other routes */
if (process.env.PORT) {
  app.get('*', function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://jaycal.herokuapp.com' + req.url)
    } else {
      next() /* Continue to other routes if we're not redirecting */
    }
  })
}

function scheduleICS (res, userid, pwd, key, reply) {
  if (reply != null) {
    res.header('Content-Type', 'text/calendar')
    res.send(reply)
  } else {
    scraper.getPage(userid, pwd).then(function (userid, key, body) {
      return scraper.parseStr(userid, body).then(function (key, r) {
        client.set(key, r)
        res.header('Content-Type', 'text/calendar')
        res.send(r)
      }.bind(this, key))
    }.bind(this, userid, key)).catch(function (err) {
      res.status(500)
      res.send('error')
      console.error(err)
    })
  }
}

app.get('/schedule.ics', function (req, res) {
  var userid = req.body.userid || req.query.userid || req.cookies['userid']
  var pwd = req.body.pwd || req.query.pwd || req.cookies['pwd']
  var key = crypto.createHash('sha256').update(userid + pwd + '@jaycal.herokuapp.com').digest('base64')
  if (redisConnected) {
    client.get(key, function (userid, pwd, key, err, reply) {
      scheduleICS(res, userid, pwd, key, reply)
    }).bind(this, userid, pwd, key)
  } else {
    scheduleICS(res, userid, pwd, key, null)
  }
})

app.get('/clear', function (req, res) {
  var userid = req.body.userid || req.query.userid || req.cookies['userid']
  var pwd = req.body.pwd || req.query.pwd || req.cookies['pwd']
  var key = crypto.createHash('sha256').update(userid + pwd + '@jaycal.herokuapp.com').digest('base64')
  client.del(key)
  res.redirect('/calendar')
})

app.get('/calendar', function (req, res) {
  res.sendFile(path.join(__dirname, 'static', 'calendar.html'))
})

app.get('/dashboard', function (req, res) {
  res.sendFile(path.join(__dirname, 'static', 'dashboard.html'))
})

app.get('/homeworks', function (req, res) {
  res.sendFile(path.join(__dirname, 'static', 'calendar_hw.html'))
})

app.get('/events', function (req, res) {
  res.sendFile(path.join(__dirname, 'static', 'calendar_events.html'))
})

app.get('/logout', function (req, res) {
  res.cookie('userid', '')
  res.cookie('pwd', '')
  res.redirect('/login')
})

app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname, 'static', 'login.html'))
})

app.post('/login', function (req, res) {
  res.cookie('userid', req.body.userid)
  res.cookie('pwd', req.body.pwd)
  res.redirect('/calendar')
})

app.get('/', function (req, res) {
  if (!req.cookies['userid'] || req.cookies['userid'] === '') {
    res.redirect('/login')
  } else {
    res.redirect('/calendar')
  }
})

var port = process.env.PORT || 8000
app.listen(port, function () {
  console.log('Example app listening on port ' + port)
})
