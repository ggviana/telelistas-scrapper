/**
 * The entry point page
 * @type {String}
 */
const BASE_URL = 'http://www.telelistas.net/br/clinicas+medicas'

module.exports.generate = (number = 1) => {
  return `${BASE_URL}?pagina=${number}`
}