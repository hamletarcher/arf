/**
 * Created by KL on 2017/4/17.
 */

const base = require('airtable').base('appi1gYl3ExDM7cW7');

var airtable = {}

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
        fields: ['Name (CN)', 'File Ref No']
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

airtable.report = function(id, callback) {

}

module.exports = airtable

