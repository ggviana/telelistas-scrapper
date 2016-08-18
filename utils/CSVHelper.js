const json2csv    = require('json2csv')
const fs          = require('fs')
const PhoneParser = require('./PhoneParser')

/**
 * Fields to be written in the csv file
 * @type {Array}
 */
const CSV_FIELDS = ['name', 'full_address', 'phones', 'description', 'link']

module.exports.generate = results => {
  console.log('[%s] Generating file', new Date)

  return json2csv({
    data: results,
    fields: CSV_FIELDS
  })
}

module.exports.cleanData = data => {
  return data
    // Transforms data
    .map(row => {
      const { full_address, phones, digits } = row

      return Object.assign(row, {
        full_address: full_address.replace(/[\n\s]+/g, ' '),
        phones: PhoneParser.parse(phones, digits)
      })
    })
    // Trims all data
    .map(row => {
      Object.keys(row).forEach(key => {
        if (row[key].trim)
          row[key] = row[key].trim()
      })

      return row
    })
}

module.exports.saveFile = csv => {
  fs.writeFile('exports/clinics.csv', csv, function (err) {
    if (err) {
      throw err
    } else {
      console.log('[%s] Clinics saved!', new Date)
      process.exit(0)
    }
  })
}