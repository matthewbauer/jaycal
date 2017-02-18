fs = require("fs")
jsdom = require("jsdom")

function scrape(obj) {
    console.log(obj.document.getElementById("ACE_STDNT_ENRL_SSV2$0").innerHTML)
}

function scrapeHTML(str) {
    jsdom.env({
        html: str,
        done: function(err, obj) {
            scrape(obj)
        }
    })
}

scrapeHTML(fs.readFileSync("./tests/m884b405.html"))
