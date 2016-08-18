#! /usr/bin/env node

const Nightmare = require('nightmare')
const URLHelper = require('./utils/URLHelper')
const CSVHelper = require('./utils/CSVHelper')

const startPage = URLHelper.generate()

const run = module.exports = function run () {
  const scrapper = Nightmare()

  scrapper
    .goto(startPage)
    .wait('#Content_Regs')
    .evaluate(thisPage => {
      const pages = Array.from(document.querySelectorAll('.resultado_roda'))
        .map(link => link.href)

      pages.unshift(thisPage)

      return pages
    }, startPage)
    .then(pages => {
      const start = Promise.resolve([])

      pages
        .reduce((accumulator, page) => {
          return accumulator
            .then(results => processPage(results, scrapper, page))
        }, start)
        .then(CSVHelper.cleanData)
        .then(CSVHelper.generate)
        .then(CSVHelper.saveFile)
    })
}

function processPage (results, scrapper, page) {
  return scrapper
    .goto(page)
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
          full_address: addressNode.textContent,
          description: descriptionNode ? descriptionNode.textContent : '',
          digits: findDigitsIn(phoneNode),
          link: linkNode.href,
          phones: phoneNode.textContent,
          name: nameNode.textContent,
        }
      })
    })
    .then(data => results.concat(data))
    .catch(error => console.log(error))
}

/**
 * Call run if script is called directly from command line
 */
if (require.main === module) {
  console.log('[%s] Started extraction', new Date)
  run()
}