const Nightmare   = require('nightmare')
const json2csv    = require('json2csv')
const fs          = require('fs')
const PhoneParser = require('./utils/phoneParser')

/**
 * Fields to be written in the csv file
 * @type {Array}
 */
const CSV_FIELDS = ['name', 'full_address', 'phones', 'description', 'link']

/**
 * The entry point page
 * @type {String}
 */
const CLINICS_PAGE = 'http://www.telelistas.net/br/clinicas+medicas?pagina=2'


const scrapper = Nightmare({
  // show: true,
  // openDevTools: { detach: true }
})

scrapper
  .goto(CLINICS_PAGE)
  .wait('#Content_Regs')
  .evaluate(() => {

    const findDigitsIn = node => {
      return Array.from(node.querySelectorAll('img'))
        .map(img => img.src)
        .map(src => src.replace(/^.*?t=(.*?)&.*?$/, '$1'))
    }

    const isSponsored = clinic => !Boolean(clinic.querySelector('.text_resultado_ib'))

    const clinics = Array.from(document.querySelectorAll('#Content_Regs > table'))
    
    return clinics.map(clinic => {
      var link

      if (isSponsored(clinic)) {

        // Extract description
        var descriptionNode = clinic.querySelector('.text_registro')

        // Extract address
        var addressNode = clinic.querySelector('.text_registro_end')

        // Extract Phone
        var phoneNode = clinic.querySelector('[class^="telInfo"]')

        // Extract name
        var nameNode = clinic.querySelector('[class^="text_resultado"]')

        // Extract link
        var linkNode = nameNode.parentNode

      } else {

        // Extract address
        var addressNode = clinic.querySelector('.text_endereco_ib')

        // Extract Phone
        var phoneNode = clinic.querySelector('.text_resultado_ib[align="right"]')

        // Extract name and link
        var nameNode = clinic.querySelector('.text_resultado_ib > a')

        // Extract link
        var linkNode = nameNode
      }

      return {
        full_address: addressNode.textContent.trim().replace(/[\n\s]+/g, ' '),
        description: descriptionNode ? descriptionNode.textContent.trim() : '',
        digits: findDigitsIn(phoneNode),
        link: linkNode.href.trim(),
        phones: phoneNode.textContent.trim(),
        name: nameNode.textContent.trim(),
      }
    })
  })
  .then(data => { // Parses the data received
    return data
      .map(row => {
        return Object.assign({}, row, {
          phones: PhoneParser.parse(row.phones, row.digits)
        })
      })
  })
  .then(data => { // Generate CSV content
    return json2csv({
      data: data,
      fields: CSV_FIELDS
    })
  })
  .then(csv => { // Save the file
    fs.writeFile('exports/clinics.csv', csv, function (err) {
      if (err) {
        throw err
      } else {
        console.log('Clinics saved!')
        process.exit(0)
      }
    })
  })
  .catch(error => console.log(error))


