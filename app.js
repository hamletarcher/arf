var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// var index = require('./routes/index');
// var report = require('./routes/report');

var app = express();
var airtable = require('./airtable')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
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
                subjects: subjects
            })
        })
    })
})

app.get('/report/:id', function(req, res) {
    console.log('/report');

    var now = new Date()

    res.render('report', {
        client: {
            name: req.params.id,
            // name: 'abc',
            fileName: 1234
        },
        dateRange: 'MM/YY',
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

// module.exports = app;

app.listen(3000, function() {
    console.log('Listening')
})