/**
 * Created by KL on 2017/4/17.
 */

var at = require('airtable')
var airtable = {}
var base

airtable.authen = function(apiKey) {
    at.configure({
        endpointUrl: 'https://api.airtable.com',
        apiKey: apiKey
    })
    base = at.base('appi1gYl3ExDM7cW7');
}

airtable.listLog = function(callback) {
    var result = []

    base('Log').select({
        view: "Report",
        filterByFormula: 'AND(LEN({With Whom})!=0, LEN({Subject})!=0)',
        fields: ['Date', 'With Whom', 'Subject', 'Report Date'],
        sort: [{field: "Date", direction: "asc"}]
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

       result = result.concat(records)
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage()

    }, function done(err) {
        if (err) { console.error(err); return; }
        callback(result)
    })
}

airtable.listPeople = function (callback) {
    var result = []

    base('People').select({
        view: "People",
        fields: ['Name (CN)', 'Initials', 'File Ref No']
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        result = result.concat(records)
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage()

    }, function done(err) {
        if (err) { console.error(err); return; }
        callback(result)
    })
}

airtable.listLogById = function(id, callback) {
    var result = []

    base('Log').select({
        view: "Report",
        filterByFormula: 'AND(LEN({With Whom})!=0, LEN({Subject})!=0)',
        sort: [{field: "Date", direction: "asc"}]
    }).eachPage(function page(records, fetchNextPage) {
        for (i=0; i<records.length; i++) {
            var subArr = records[i].get('Subject')
            for (j=0; j<subArr.length; j++) {
                if (subArr[j] == id) {
                    result.push(records[i])
                    break
                }
            }
        }
        fetchNextPage()
    }, function done(err) {
        if (err) { console.error(err); return; }
        callback(result)
    })
}

airtable.updateReportDates = function(ids) {
    var today = new Date()
    today = today.toISOString().substr(0, 10)
    for (i=0; i<ids.length; i++) {
        base('Log').update(ids[i], {
            'Report Date': today
        }, function(err, record) {
            if (err) { console.error(err); return; }
        });
    }
}

module.exports = airtable

