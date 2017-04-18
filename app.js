var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// var index = require('./routes/index');
// var report = require('./routes/report');

var app = express();
var airtable = require('./air')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: "7UYa0FGTS5aR"}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/authen', function(req, res) {
    res.render('authen');
})

app.post('/authen', function(req, res) {
    if (!req.body.secret) {
        res.status('400')
        res.send("Invalid secret")
    } else {
        req.session.secret = req.body.secret
        res.redirect('/')
    }
})

function checkAuthen(req, res, next) {
    if(req.session.secret){
        airtable.authen(req.session.secret)
        next();     //If session exists, proceed to page
    } else {
        res.redirect('/authen')
    }
}

app.get('/', checkAuthen, function(req, res) {
    airtable.listLog(function processLog(log) {
        var subjects = []
        for (i=0; i<log.length; i++) {
            var logSub = log[i].get('Subject')
            for (j=0; j<logSub.length; j++) {
                var index = -1
                for (k=0; k<subjects.length; k++) {
                    if (subjects[k].id == logSub[j]) {
                        index = k
                        break
                    }
                }
                if (index < 0) {
                    subjects.push({
                        id: logSub[j],
                        activities: [log[i]]
                    })
                } else {
                    subjects[index].activities.push(log[i])
                }
            }
        }

        airtable.listPeople(function addNames(people) {
            for (i=0; i<subjects.length; i++) {
                for (j=0; j<people.length; j++) {
                    if (subjects[i].id === people[j].id) {
                        subjects[i].name = people[j].get('Name (CN)')
                        subjects[i].fileNo = people[j].get('File Ref No')
                    }
                }
            }

            subjects.sort(function(a, b) {return a.name > b.name});

            res.render('index', {
                title: 'ARF',
                subjects: subjects
            })
        })
    })
})

app.get('/report/:id', checkAuthen, function(req, res) {
    airtable.listLogById(req.params.id, function processLog(log) {
        var client = {
            id: req.params.id
        }

        if (log.length == 0)
            throw "No record found"

        airtable.listPeople(function addNames(people) {
            var logIds = []

            for (i=0; i<log.length; i++) {
                logIds.push(log[i].id)

                for (k=0; k<people.length; k++) {
                    if (client.id === people[k].id) {
                        client.name = people[k].get('Initials')
                        client.fileNo = people[k].get('File Ref No')
                    }
                }

                // add with whom names
                var withWhom = log[i].get('With Whom')
                var withWhomNames = []
                for (j=0; j<withWhom.length; j++) {
                    if (withWhom[j] === client.id) {
                        withWhomNames.push('Client')
                        break
                    }
                }
                if (log[i].get('Relationship with Subject') !== undefined) {
                    withWhomNames.push(log[i].get('Relationship with Subject'))
                }
                log[i].withWhomNames = withWhomNames.join(', ');

                // add nature of contacts radio button position
                var natureRadio = new Array(10).fill('');
                switch (log[i].get('Nature')) {
                    case 'Office interview':
                        natureRadio[0] = 'X'
                        break
                    case 'Visits':
                        natureRadio[1] = 'X'
                        break
                    case 'Telephone call':
                        natureRadio[2] = 'X'
                        break
                    case 'Letter/report/written referral':
                        natureRadio[3] = 'X'
                        break
                    case 'Group program session':
                        natureRadio[4] = 'X'
                        break
                    case 'Case discussion':
                        natureRadio[5] = 'X'
                        break
                    case 'Collateral contact':
                        natureRadio[6] = 'X'
                        break
                    case 'Case conference':
                        natureRadio[7] = 'X'
                        break
                    case 'Escort':
                        natureRadio[8] = 'X'
                        break
                    default:
                        natureRadio[9] = 'X'
                }
                log[i].natureRadio = natureRadio

                // format stuff
                log[i].description = ''

                if (log[i].get('Key Issues Discussed') !==  undefined) {
                    log[i].description += log[i].get('Key Issues Discussed')
                        .replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');
                } else if (log[i].get('Issues Discussed') !== undefined) {
                    log[i].description += log[i].get('Issues Discussed')
                        .replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');
                }

                if (log[i].get('Intervention') !== undefined) {
                    log[i].description += '\n\n<b>Intervention:</b>\n' + log[i].get('Intervention')
                            .replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');
                }

                if (log[i].get('Plan') !== undefined) {
                    log[i].description += '\n\n<b>Plan:</b>\n' + log[i].get('Plan')
                            .replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');
                }

                log[i].description = log[i].description.replace(new RegExp('\n', 'g'), '<br />')
                // console.log(log[i])
            }

            log.sort(function(a, b) {return a.get('Date') > b.get('Date')});

            var now = new Date()

            res.render('report', {
                title: 'ARF ' + client.name,
                client: client,
                activities: log,
                dateRange: log[0].get('Date').substr(0,7) + ' to ' + log[log.length-1].get('Date').substr(0,7),
                today: now.toISOString().substr(0,10)
            })

            airtable.updateReportDates(logIds)
        })
    })
})

app.get('/footer', function(req, res) {
    var now = new Date()
    res.render('footer', {
        title: 'ARF Footer',
        today: now.toISOString().substr(0,10)
    })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, function() {
    console.log('Listening')
})

module.exports = app;