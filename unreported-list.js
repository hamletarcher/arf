/**
 * Created by KL on 2017/4/17.
 */

var airtable = require('./airtable.js')

function showList(records) {
    for (i=0; i<records.length; i++) {
        console.log(records[i].id);
    }
}

airtable.listUnreported(showList)