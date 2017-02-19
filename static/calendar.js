function getCookie(cname) {
    var name = cname + "="
    var decodedCookie = decodeURIComponent(document.cookie)
    var ca = decodedCookie.split(';')
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }
    return ""
}

userid = getCookie('userid')
pwd = getCookie('pwd')

$(document).ready(function() {

    $('#calendar').fullCalendar({
      header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,agendaWeek,agendaDay'
			},
    })

    req = new XMLHttpRequest()
    req.onreadystatechange = function (oEvent) {
    if (req.readyState === 4) {
        if (req.status === 200) {
            $('#calendar').fullCalendar('addEventSource', fc_events(this.response, {}))
            $('#calendar').fullCalendar('addEventSource', expand_recur_events)
         } else if (req.status == 0) {
         } else {
             window.location.href = "/logout"
         }
      }
    };
    req.open("GET", "/schedule.ics")
    req.send()
})
