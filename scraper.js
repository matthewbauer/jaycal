fs = require("fs")
https = require("https")
jsdom = require("jsdom")
ical = require("ical.js")
formurlencoded = require('form-urlencoded')
request = require("request")

function scrapeScheduleObj(obj) {
    classes = obj.document.getElementById("ACE_STDNT_ENRL_SSV2$0").getElementsByClassName("PSGROUPBOXWBO")
    return Array.prototype.map.call(classes, function(c) {
        rows = Array.prototype.slice.call(c.getElementsByClassName("PSGROUPBOX")[0].getElementsByClassName("PSLEVEL3GRIDNBO")[1].getElementsByTagName("tbody")[0].getElementsByTagName("tr"), 1)
        return {
            name: c.getElementsByClassName("PAGROUPDIVIDER")[0].textContent,
            status: c.getElementsByClassName("PSEDITBOX_DISPONLY")[0].textContent,
            units: c.getElementsByClassName("PSEDITBOX_DISPONLY")[1].textContent,
            grading: c.getElementsByClassName("PSEDITBOX_DISPONLY")[2].textContent,
            grade: c.getElementsByClassName("PSEDITBOX_DISPONLY")[3].textContent,
            //            deadlines: c.getElementsByClassName("PAGROUPDIVIDER")[0].textContent,
            //            textbook: c.getElementsByClassName("PAGROUPDIVIDER")[0].textContent,
            sections: rows.map(function(t) {
                return {
                    number: t.getElementsByClassName("PSEDITBOX_DISPONLY")[0].textContent,
                    component: t.getElementsByClassName("PSEDITBOX_DISPONLY")[1].textContent,
                    times: t.getElementsByClassName("PSEDITBOX_DISPONLY")[2].textContent,
                    room: t.getElementsByClassName("PSEDITBOX_DISPONLY")[3].textContent,
                    dates: t.getElementsByClassName("PSEDITBOX_DISPONLY")[4].textContent,
                    instructors: t.getElementsByClassName("PSLONGEDITBOX")[0].textContent.split(", \n"),
                    // section: t.getElementsByClassName("PSHYPERLINK")[0].textContent,
                }
            })

        }
    })
}

function scrapeScheduleStr(str) {
    return new Promise(function (resolve, reject) {
        jsdom.env({
            html: str,
            done: function(err, obj) {
                try {
                    result = scrapeScheduleObj(obj)
                } catch(e) {
                    reject(e)
                    return
                }
                resolve(result)
            }
        })
    })
}

function getDays(dates) {
    days = dates.split(" ")[0]
    ds = []
    for (var i = 0; i < days.length; i++) {
        if (days[i] == "T") {
            if (days[i+1] == "u") {
                ds.push("Tuesday")
            } else {
                ds.push("Thursday")
            }
            i++
        } else if (days[i] == "S"){
            if (days[i+1] == "u") {
                ds.push("Sunday")
            } else {
                ds.push("Saturday")
            }
            i++
        } else {
            ds.push({
                "M": "Monday",
                "W": "Wednesday",
                "F": "Friday"
            }[days[i]]);
        }
    }
    return ds
}

function isEnrolled(obj) {
    return obj.status == "Enrolled"
}

function toJCal(obj, id) {
    email = id + "@ku.edu"
    events = [].concat.apply([], obj.map(function(c) {
        return [].concat.apply([], c.sections.map(function(s) {
            days = getDays(s.times)
            return days.map(function(day) {
                summary = c.name.split(" - ")[0]
                description = c.name +
                    "\nsection number: " + s.number +
                    "\nunits: " + c.units +
                    "\ninstructor: " + ", ".join(c.instructors)
                start_time = s.times.split(" ")[1]

                end_time = s.times.split(" ")[3]

                start = new Date(s.dates.split(" - ")[0])

                currentDay = start.getDay();
                distance = {
                    "Sunday": 0,
                    "Monday": 1,
                    "Tuesday": 2,
                    "Wednesday" : 3,
                    "Thursday": 4,
                    "Friday": 5,
                    "Saturday": 6
                }[day] - currentDay;
                if (distance < 0) { // monday fix
                    distance += 7
                }
                start.setDate(start.getDate() + distance);

                start_hours = parseInt(start_time.split(":")[0])
                if (start_time.split(":")[1].endsWith("PM") && !start_time.startsWith("12")) {
                    start_hours += 12
                }
                start.setHours(start_hours)
                start.setMinutes(start_time.split(":")[1].slice(0, 2))

                start_end = new Date(start.getTime())
                start_end_hours = parseInt(end_time.split(":")[0])
                if (end_time.split(":")[1].endsWith("PM") && !end_time.startsWith("12")) {
                    start_end_hours += 12
                }
                start_end.setHours(start_end_hours)
                start_end.setMinutes(end_time.split(":")[1].slice(0, 2))

                end = new Date(s.dates.split(" - ")[1])
                end.setDate(end.getDate() - 7)

                return ["vevent",
                        [
                            ["dtstamp", {}, "date-time", (new Date()).toISOString()],
                            ["dtstart", {}, "date-time", start.toISOString()],
                            ["dtend", {}, "date-time", start_end.toISOString()],
                            ["location", {}, "text", s.room],
                            ["organizer", {}, "text", "mailto:" + email],
                            ["uid", {}, "text", "" + Math.floor(Math.random() * Math.pow(10, 10))],
                            ["summary", {}, "text", summary],
                            ["description", {}, "text", description],
                            ["rrule", {}, "recur", {
                                "freq": "WEEKLY",
                                "until": end.toISOString(),
                            }],
                        ],
                        []
                       ]
            })
        }))
    }))
    return ["vcalendar",
            [
                ["calscale", {}, "text", "GREGORIAN"],
                ["prodid", {}, "text", "-//kucal//KU Calendar//EN"],
                ["version", {}, "text", "2.0"]
            ],
            events
           ]
}

function parseFile(id) {
    scrapeScheduleStr(fs.readFileSync("./tests/" + id + ".html")).then(function(o) {
        jcal = toJCal(o.filter(isEnrolled), id)
        ical_str = ical.stringify(jcal)
        fs.writeFileSync(id + ".ics", ical_str)
    })
}

agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/602.4.8 (KHTML, like Gecko) Version/10.0.3 Safari/602.4.8"

function getPage(userid, pwd) {
    return new Promise(function (resolve, reject) {
        var j = request.jar()
        request({
            url : "https://sa.ku.edu/psp/csprd/?cmd=login&languageCd=ENG&",
            method: "POST",
            form: {userid: userid, pwd: pwd},
            headers: {
                'User-Agent': agent
            },
            jar: j,
        }, function(err,res,body) {
            request({
                url: "https://sa.ku.edu/psc/csprd/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL",
                headers: {
                    'User-Agent': agent
                },
                jar: j
            }, function(err,res,body) {
                resolve(body)
            })
        })
    })
}

module.exports.getPage = getPage
module.exports.parseStr = function(id, s) {
    return scrapeScheduleStr(s).then(function(o) {
        jcal = toJCal(o.filter(isEnrolled), id)
        return ical.stringify(jcal)
    })
}
