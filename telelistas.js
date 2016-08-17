const Nightmare   = require('nightmare')
const json2csv    = require('json2csv')
const fs          = require('fs')
const PhoneParser = require('./utils/phoneParser')

/**
 * Fields to be written in the csv file
 * @type {Array}
 */
const CSV_FIELDS = ['name', 'full_address', 'phones', 'description', 'link']

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
      let description, address, phones, name, link

      if (isSponsored(clinic)) {

        // Extract description
        description = clinic.querySelector('.text_registro').textContent.trim()

        // Extract address
        address = clinic.querySelector('.text_registro_end').textContent.trim().replace(/[\n\s]+/g, ' ')

        // Extract Phone
        let phoneNode = clinic.querySelector('[class^="telInfo"]')

        phones = phoneNode.textContent.trim()
        digits = findDigitsIn(phoneNode)

        // Extract name and link
        let nameNode = clinic.querySelector('[class^="text_resultado"]')

        name = nameNode.textContent.trim()
        link = nameNode.parentNode.href.trim()

      } else {

        // Extract description
        description = ''

        // Extract address
        address = clinic.querySelector('.text_endereco_ib').textContent.trim().replace(/[\n\s]+/g, ' ')

        // Extract Phone
        let phoneNode = clinic.querySelector('.text_resultado_ib[align="right"]')

        phones = phoneNode.textContent.trim()
        digits = findDigitsIn(phoneNode)

        // Extract name and link
        let nameNode = clinic.querySelector('.text_resultado_ib > a')

        name = nameNode.textContent.trim()
        link = nameNode.href.trim()
      }

      return {
        full_address: address,
        description: description,
        digits: digits,
        link: link,
        phones: phones,
        name: name,
      }
    })
  })
  .then(data => {
    return data
      .map(row => {
        return Object.assign({}, row, {
          phones: PhoneParser.parse(row.phones, row.digits)
        })
      })
  })
  .then(data => {
    return json2csv({
      data: data,
      fields: CSV_FIELDS
    })
  })
  .then(csv => {
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


