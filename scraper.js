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
            }).filter(hasSection)

        }
    })
}

function scrapeScheduleStr(str) {
    return new Promise(function (resolve, reject) {
        jsdom.env({
            html: str,
            done: function(err, obj) {
                if (err) {
                    reject(err)
                    return
                }
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
                ds.push("TU")
            } else {
                ds.push("TH")
            }
            i++
        } else if (days[i] == "S"){
            if (days[i+1] == "u") {
                ds.push("SU")
            } else {
                ds.push("SA")
            }
            i++
        } else {
            ds.push({
                "M": "MO",
                "W": "WE",
                "F": "FR"
            }[days[i]]);
        }
    }
    return ds
}

function isEnrolled(obj) {
    return obj.status == "Enrolled"
}

function hasSection(obj) {
    return obj.number != " "
}

exdates = {
    "01/17/2017": ["2017-03-20", "2017-03-21", "2017-03-22", "2017-03-23", "2017-03-24"]
}

finals = {
    "01/17/2017": {
"9:00 MWF": ["2017-05-08T07:30:00", "2017-05-08T10:00:00"],
"9:00 MW": ["2017-05-08T07:30:00", "2017-05-08T10:00:00"],
"9:00 MF": ["2017-05-08T07:30:00", "2017-05-08T10:00:00"],
"9:00 WF": ["2017-05-08T07:30:00", "2017-05-08T10:00:00"],

"11:00 TR": ["2017-05-08T10:30:00", "2017-05-08T13:00:00"],
"11:30 TR": ["2017-05-08T10:30:00", "2017-05-08T13:00:00"],

"3:30 TR": ["2017-05-08T13:30:00", "2017-05-08T16:00:00"],
"4:00 TR": ["2017-05-08T13:30:00", "2017-05-08T16:00:00"],
"4:30 TR": ["2017-05-08T13:30:00", "2017-05-08T16:00:00"],

"CHIN 104": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"CHIN 108": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"CHIN 204": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"CHIN 208": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 110": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 120": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 230": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 231": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 234": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 240": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"FREN 241": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"GERM 104": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"GERM 108": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"GERM 201": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"GERM 202": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"GERM 203": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"HEBR 110": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"HEBR 120": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"HEBR 210": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"HEBR 220": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"ITAL 110": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"ITAL 120": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"ITAL 230": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"ITAL 240": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"JPN 104": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"JPN 108": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"JPN 204": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"JPN 208": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"JPN 306": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"JPN 310": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"LAT 104": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"LAG 105": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"LAG 108": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"LAG 109": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"RUSS 104": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"RUSS 108": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"RUSS 204": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"RUSS 208": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"SPAN 104": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],
"SPAN 108": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"SPAN 111": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"SPAN 212": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"SPAN 213": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"SPAN 216": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"], 
"SPAN 217": ["2017-05-08T16:30:00", "2017-05-08T19:00:00"],

"CHEM 130": ["2017-05-08T19:30:00", "2017-05-08T22:00:00"],
"CHEM 135": ["2017-05-08T19:30:00", "2017-05-08T22:00:00"],

"10:00 MWF": ["2017-05-09T07:30:00", "2017-05-09T10:00:00"],
"10:00 MW": ["2017-05-09T07:30:00", "2017-05-09T10:00:00"],
"10:00 MF": ["2017-05-09T07:30:00", "2017-05-09T10:00:00"],
"10:00 WF": ["2017-05-09T07:30:00", "2017-05-09T10:00:00"],

"12:00 TR": ["2017-05-09T10:30:00", "2017-05-09T13:00:00"],
"12:30 TR": ["2017-05-09T10:30:00", "2017-05-09T13:00:00"],

"2:30 TR": ["2017-05-09T13:30:00", "2017-05-09T16:00:00"],

"MATH 220": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 290": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 291": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 101": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 104": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 115": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 125": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 126": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 127": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 145": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 146": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],
"MATH 147": ["2017-05-09T16:30:00", "2017-05-09T19:00:00"],

"FIN 410": ["2017-05-09T19:30:00", "2017-05-09T22:00:00"],
"FIN 411": ["2017-05-09T19:30:00", "2017-05-09T22:00:00"],
"ACCT 330": ["2017-05-09T19:30:00", "2017-05-09T22:00:00"],
"PSYC 104": ["2017-05-09T19:30:00", "2017-05-09T22:00:00"],

"8:00 TR": ["2017-05-10T07:30:00", "2017-05-10T10:00:00"],
"8:30 TR": ["2017-05-10T07:30:00", "2017-05-10T10:00:00"],

"12:00 MWF": ["2017-05-10T10:30:00", "2017-05-10T13:00:00"],
"12:00 MW": ["2017-05-10T10:30:00", "2017-05-10T13:00:00"],
"12:00 MF": ["2017-05-10T10:30:00", "2017-05-10T13:00:00"],
"12:00 WF": ["2017-05-10T10:30:00", "2017-05-10T13:00:00"],

"2:00 MWF": ["2017-05-10T13:30:00", "2017-05-10T16:00:00"],
"2:00 MW": ["2017-05-10T13:30:00", "2017-05-10T16:00:00"],
"2:00 MF": ["2017-05-10T13:30:00", "2017-05-10T16:00:00"],
"2:00 WF": ["2017-05-10T13:30:00", "2017-05-10T16:00:00"],

"10:30 TR": ["2017-05-10T16:30:00", "2017-05-10T19:00:00"],
"4:00 MWF": ["2017-05-10T16:30:00", "2017-05-10T19:00:00"],
"4:00 MW": ["2017-05-10T16:30:00", "2017-05-10T19:00:00"],
"4:00 MF": ["2017-05-10T16:30:00", "2017-05-10T19:00:00"],
"4:00 WF": ["2017-05-10T16:30:00", "2017-05-10T19:00:00"],

"ACCT 200": ["2017-05-10T19:30:00", "2017-05-10T22:00:00"],
"ACCT 201": ["2017-05-10T19:30:00", "2017-05-10T22:00:00"],

"9:30 TR": ["2017-05-11T07:30:00", "2017-05-11T10:00:00"],

"12:30 MW": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],
"12:30 MF": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],
"12:30 WF": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],
"1:00 MWF": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],
"1:00 MW": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],
"1:00 MF": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],
"1:00 WF": ["2017-05-11T10:30:00", "2017-05-11T13:00:00"],

"3:00 MWF": ["2017-05-11T13:30:00", "2017-05-11T16:00:00"],
"3:00 MW": ["2017-05-11T13:30:00", "2017-05-11T16:00:00"],
"3:00 MF": ["2017-05-11T13:30:00", "2017-05-11T16:00:00"],
"3:00 WF": ["2017-05-11T13:30:00", "2017-05-11T16:00:00"],

"EECS 128": ["2017-05-11T16:30:00", "2017-05-11T19:00:00"],
"EECS 138": ["2017-05-11T16:30:00", "2017-05-11T19:00:00"],
"PSYC 210": ["2017-05-11T16:30:00", "2017-05-11T19:00:00"],
"CHEM 330": ["2017-05-11T16:30:00", "2017-05-11T19:00:00"],
"ACCT 320": ["2017-05-11T16:30:00", "2017-05-11T19:00:00"],
"ACCT 410": ["2017-05-11T16:30:00", "2017-05-11T19:00:00"],

"ACCT 543": ["2017-05-11T19:30:00", "2017-05-11T22:00:00"],
"FMS 100": ["2017-05-11T19:30:00", "2017-05-11T22:00:00"],

"7:35 MW": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],
"7:35 MF": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],
"7:35 WF": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],
"8:00 MWF": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],
"8:00 MW": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],
"8:00 MF": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],
"8:00 WF": ["2017-05-12T07:30:00", "2017-05-12T10:00:00"],

"11:00 MWF": ["2017-05-12T10:30:00", "2017-05-12T13:00:00"],
"11:00 MW": ["2017-05-12T10:30:00", "2017-05-12T13:00:00"],
"11:00 MF": ["2017-05-12T10:30:00", "2017-05-12T13:00:00"],
"11:00 WF": ["2017-05-12T10:30:00", "2017-05-12T13:00:00"],

"1:00 TR": ["2017-05-12T13:30:00", "2017-05-12T15:00:00"],
"1:30 TR": ["2017-05-12T13:30:00", "2017-05-12T15:00:00"]
    }
}

weekDays = {
    "SU": 0,
    "MO": 1,
    "TU": 2,
    "WE" : 3,
    "TH": 4,
    "FR": 5,
    "SA": 6
}

function toJCal(obj, id) {
    email = id + "@ku.edu"
    events = [].concat.apply([], obj.map(function(c) {
        return [].concat.apply([], c.sections.map(function(s) {
            days = getDays(s.times)
            summary = c.name.split(" - ")[0]
            description = c.name +
                "\nsection number: " + s.number +
                "\nunits: " + c.units
            if (s.room)
                description += "\nroom number: " + s.room
            if (s.instructors)
                description += "\ninstructor: " + s.instructors.join(", ")

            start_time = s.times.split(" ")[1]

            end_time = s.times.split(" ")[3]

            start = new Date(s.dates.split(" - ")[0])

            currentDay = start.getDay();
            distance = {
                "SU": 0,
                "MO": 1,
                "TU": 2,
                "WE" : 3,
                "TH": 4,
                "FR": 5,
                "SA": 6
            }[days[0]] - currentDay
            if (distance < 0) { // monday fix
                if (days.length > 1)
                    distance = {
                        "SU": 0,
                        "MO": 1,
                        "TU": 2,
                        "WE" : 3,
                        "TH": 4,
                        "FR": 5,
                        "SA": 6
                    }[days[1]] - currentDay
                else
                    distance += 7
            }
            start.setDate(start.getDate() + distance)

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

            subject = c.name.split(" - ")[0].replace(" ", "+")
            url = "https://classes.ku.edu/Classes/CourseSearchAPI.action?classesSearchText=" + subject

            uid = ""
            if (s.number == " ") {
                uid = Math.floor(Math.random() * Math.pow(10, 10)) + "@jaycal.herokuapp.com"
            } else {
                uid = s.number + "@jaycal.herokuapp.com"
            }

            startDay = s.dates.split(" - ")[0]
            
            // holidays
            if (exdates[startDay])
                exdate = ["exdate", {}, "date-time"].concat(exdates[s.dates.split(" - ")[0]].filter(function(d) {
                    date = new Date(d)
                    // date.setDate(date.getDate() + 1) // weird hack
                    return days.some(function(n) {
                        return weekDays[n] == date.getDay()
                    })
                }).map(function(d) {
                    date = new Date(d)
                    // date.setDate(date.getDate() + 1) // weird hack
                    // date.setHours(start_hours + 1) // daylight saving hack
                    date.setHours(start_hours)
                    date.setMinutes(start_time.split(":")[1].slice(0, 2))
                    return date.toISOString()
                }))
            else
                exdate = []

            ret = []

            // exams
            finalTimes = []
            classCode = c.name.split(" - ")[0]
            startTime = start_time.split(":")[0] + ":" + start_time.split(":")[1].slice(0, 2)
            days_ = days.map(function(d) {
                return {
                    "SU": "S",
                    "MO": "M",
                    "TU": "T",
                    "WE" : "W",
                    "TH": "R",
                    "FR": "F",
                    "SA": "S"
                }[d]
            }).join("")

            if (finals[startDay][classCode]) {
                finalTimes = finals[startDay][classCode]
            } else if (finals[startDay][startTime + " " + days_]) {
                finalTimes = finals[startDay][startTime + " " + days_]
            }

            if (finalTimes.length == 2) {
                finalEvent = ["vevent",
                              [
                                  ["dtstamp", {}, "date-time", (new Date()).toISOString()],
                                  ["dtstart", {}, "date-time", new Date(finalTimes[0]).toISOString()],
                                  ["dtend", {}, "date-time", new Date(finalTimes[1]).toISOString()],
                                  ["location", {}, "text", s.room],
                                  ["organizer", {}, "text", "mailto:" + email],
                                  ["uid", {}, "text", "F" + uid],
                                  ["summary", {}, "text", summary + " Final"],
                                  ["description", {}, "text", c.name + " Final"],
                                  ["url", {}, "text", url]
                              ],
                              []
                             ]
                ret.push(finalEvent)
            }

            list = [
                ["dtstamp", {}, "date-time", (new Date()).toISOString()],
                ["dtstart", {}, "date-time", start.toISOString()],
                ["dtend", {}, "date-time", start_end.toISOString()],
                ["location", {}, "text", s.room],
                ["organizer", {}, "text", "mailto:" + email],
                ["uid", {}, "text", uid],
                ["summary", {}, "text", summary],
                ["description", {}, "text", description],
                ["rrule", {}, "recur", {
                    "freq": "WEEKLY",
                    "byday": days.join(","),
                    "until": end.toISOString(),
                }],
                ["url", {}, "text", url]
            ]

            if (exdate.length > 3) {
                list.push(exdate)
            }

            event = ["vevent",
                     list,
                     []
                    ]

            ret.push(event)

            return ret
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
    return scrapeScheduleStr(fs.readFileSync("./tests/" + id + ".html")).then(function(o) {
        jcal = toJCal(o.filter(isEnrolled), id)
        ical_str = ical.stringify(jcal)
        fs.writeFileSync(id + ".ics", ical_str)
    })
}

agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/602.4.8 (KHTML, like Gecko) Version/10.0.3 Safari/602.4.8"

function getPage(userid, pwd) {
    return new Promise(function (userid, pwd, resolve, reject) {
        var j = request.jar()
        request({
            url : "https://sa.ku.edu/psp/csprd/?cmd=login&languageCd=ENG&",
            method: "POST",
            form: {userid: userid, pwd: pwd},
            headers: {
                'User-Agent': agent
            },
            jar: j,
        }, function(j, err, res, body) {
            if (err) {
                reject(err)
                return
            }
            request({
                url: "https://sa.ku.edu/psc/csprd/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL",
                headers: {
                    'User-Agent': agent
                },
                jar: j
            }, function(err, res, body) {
                if (err) {
                    reject(err)
                    return
                }
                resolve(body)
            })
        }.bind(this, j))
    }.bind(this, userid, pwd))
}

module.exports.getPage = getPage
module.exports.parseStr = function(id, s) {
    return scrapeScheduleStr(s).then(function(o) {
        jcal = toJCal(o.filter(isEnrolled), id)
        return ical.stringify(jcal)
    })
}
