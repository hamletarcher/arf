/**
 * Created by KL on 2017/4/17.
 */

const base = require('airtable').base('appi1gYl3ExDM7cW7');

var airtable = {}

airtable.listUnreported = function(callback) {
    var result = []

    base('Log').select({
        view: "Report"
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

