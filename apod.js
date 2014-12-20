/**
 * Format a date to the form YYMMDD
 */
function formatDate(date) {
    function numfmt(num) {
        // return last two digits of number, pad with 0 if necessary
        var end = '' + (num % 100);
        if (end.length == 1)
            return '0'+end;
        return end;
    }
    return numfmt(date.getFullYear()) + numfmt(date.getMonth()+1) + numfmt(date.getDate());
}

var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    args = require('flagman')({
        '--type': {
            'default': 'today',
            'validOptions': ['random', 'today'],
            'description': 'Find either random image or for a specific day.'
        },
        '--date': {
            // defaults to today
            'default': formatDate(new Date()),
            'validRegex': /\d{6}/,
            'description': 'Date in the format "YYMMDD". Under random, defines earliest possible date. Under today, defines date to get.'
        },
        '--download': {
            'description': "Download the image we find to given path and print the resulting path."
        },
        '--description': {
            'validOptions': [],
            'description': "Print the picture explanation."
        }
    }, {
        description: ["apodjs is a tool to find and download NASA's astronomy picture of the day.",
                      "With no arguments, the program will print the URL to today's picture."].join('\n')
    }),
    URLtemplate = "http://apod.nasa.gov/apod/ap{{DATE}}.html";

/**
 * Parse YYMMDD as a JavaScript date
 */
function parseDate(dateStr) {
    var curYear = (new Date()).getFullYear() % 100,
        givenYear = parseInt(dateStr.slice(0,2)),
        givenMonth = parseInt(dateStr.slice(2,4))-1,
        givenDay = parseInt(dateStr.slice(4,6));
    if (givenYear <= curYear)
        givenYear = 2000 + givenYear;
    else
        givenYear = 1900 + givenYear;
    return new Date(givenYear, givenMonth, givenDay);
}

/**
 * Find the URL as a string to a picture of random date between given date
 * and today's date.
 * If printDesc is true, print the image explanation as well.
 * Then do callback(sourceURL).
 */
function pickRandomPicture(date, printDesc, callback) {
    // pick a random date by getting current epoch time and start epoch time
    // then making a date out of a uniformly random time in between
    var past = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
        now = new Date(),
        current = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
                now.getHours()),
        randTime = (current - past)*Math.random() + past,
        randDate = new Date(parseInt(randTime));
    return getDatePicture(randDate, printDesc, callback);
}

/**
 * Find the URL as a string to the picture on given date.
 * If not possible (e.g. no image found or it's a video), return null.
 * If printDesc is true, print the image explanation as well.
 * Then do callback(sourceURL).
 */
function getDatePicture(date, printDesc, callback) {
    var url = URLtemplate.replace("{{DATE}}", formatDate(date));
    request(url, function(error, response, html) {
        if (error) {
            console.log(error);
            return;
        }
        var $ = cheerio.load(html);
        if (printDesc)
            console.log($('body > p:nth-child(3)').text());
        callback("http://apod.nasa.gov/apod/"+$("img").attr('src'));
    });
}

/**
 * Download the contents of URL and save to current working directory.
 * Return string representing path of the saved image.
 */
function downloadURL(url, folder) {
    var filename = /[^\/]*$/.exec(url);
    if (filename !== null)
        filename = filename[0];
    else
        filename = "APODdownload";
    var fullpath = path.join(folder, filename);
    request(url).pipe(fs.createWriteStream(fullpath));
    return fullpath;
}

function main() {
    "use strict";
    var date = parseDate(args.date);

    // if we download the picture, print where we download it
    // otherwise print the url to the picture instead
    function handleURL(url) {
        if (args.download) {
            if (url !== null)
                console.log(downloadURL(url, args.download));
            else
                console.log("Could not find picture. Check your internet or the date.")
        } else {
            console.log(url);
        }
    }

    if (args.type === 'random') {
        // try a few times in case we pick a bad date sometimes
        var numTries = 5,
            repeater = function(url) {
                numTries--;
                if (url || numTries == 0) {
                    handleURL(url);
                    return;
                }
                // keep trying
                pickRandomPicture(date, args.description, repeater);
            };
        repeater(null);
    }
    else {
        getDatePicture(date, args.description, handleURL);
    }
}

// if args are undefined then we must have printed out usage info or errored
if (args)
    main();
