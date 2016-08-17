const Nightmare = require('nightmare')
const json2csv  = require('json2csv')
const fs        = require('fs')

/**
 * Fields to be written in the csv file
 * @type {Array}
 */
const CSV_FIELDS = ['name', 'full_address', 'phones', 'areas', 'link']

const CLINICS_PAGE = 'http://www.telelistas.net/br/clinicas+medicas?pagina=2'

const scrapper = Nightmare({
  // show: true,
  // openDevTools: { detach: true }
})

scrapper
  .goto(CLINICS_PAGE)
  .wait('#Content_Regs')
  .evaluate(() => {

    const digit1map = {
      "6F": 0, "6E": 1, "6D": 2, "6C": 3, "6B": 4,
      "6A": 5, "69": 6, "68": 7, "67": 8, "66": 9,
    }

    const digit2map = {
      "7D": 0, "7C": 1, "7F": 2, "7E": 3, "79": 4, 
      "78": 5, "7B": 6, "7A": 7, "75": 8, "74": 9,
    }

    const decodeDigits = text => {
      const firstDigit  = text.substring(0,2)
      const secondDigit = text.substring(2,4)

      return `${digit1map[firstDigit]}${digit2map[secondDigit]}`
    }

    const findPhonesIn = node => {
      const phones = node.textContent.trim()

      const lastDigits = Array.from(node.querySelectorAll('img'))
        .map(img => img.src)
        .map(src => src.replace(/^.*?t=(.*?)&.*?$/, '$1'))
        .map(digits => decodeDigits(digits))

      return phones
        .split('|')
        .map(phone => phone.replace(/[\n\s]+/g, ' '))
        .map(phone => phone.replace(/\D+$/, ''))
        .map(phone => phone.trim())
        .map((phone, index) => `${phone}${lastDigits[index]}`)
        .join(', ')
    }

    const clinics = Array.from(document.querySelectorAll('#Content_Regs > table'))
    
    return clinics.map(clinic => {
      let areas, address, phones, name, link

      const isSponsored = !Boolean(clinic.querySelector('.text_resultado_ib'))

      if (isSponsored) {

        // Extract areas
        areas = clinic.querySelector('.text_registro').textContent.trim()

        // Extract address
        address = clinic.querySelector('.text_registro_end').textContent.trim().replace(/[\n\s]+/g, ' ')

        // Extract Phone
        phones = findPhonesIn(clinic.querySelector('[class^="telInfo"]'))

        // Extract name
        name = clinic.querySelector('[class^="text_resultado"]').textContent.trim()

        // Extract link
        link = clinic.querySelector('[class^="text_resultado"]').parentNode.href.trim()

      } else {

        // Extract areas
        areas = ''

        // Extract address
        address = clinic.querySelector('.text_endereco_ib').textContent.trim().replace(/[\n\s]+/g, ' ')

        // Extract Phone
        phones = findPhonesIn(clinic.querySelector('.text_resultado_ib[align="right"]'))

        let nameNode = clinic.querySelector('.text_resultado_ib > a')

        // Extract name
        name = nameNode.textContent.trim()

        // Extract link
        link = nameNode.href.trim()
      }

      return {
        full_address: address,
        areas: areas,
        link: link,
        phones: phones,
        name: name,
      }
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


