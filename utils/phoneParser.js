module.exports.parse = (content, encodedDigits) => {
  const phones = content.trim()

  const lastDigits = encodedDigits
    .map(digits => decodeDigits(digits))

  return phones
    .split('|')
    .map(phone => phone.replace(/[\n\s]+/g, ' '))
    .map(phone => phone.replace(/\D+$/, ''))
    .map(phone => phone.trim())
    .map((phone, index) => `${phone}${lastDigits[index]}`)
    .join(', ')
}

const FIRST_DIGIT_MAP = {
  "6F": 0, "6E": 1, "6D": 2, "6C": 3, "6B": 4,
  "6A": 5, "69": 6, "68": 7, "67": 8, "66": 9,
}

const SECOND_DIGIT_MAP = {
  "7D": 0, "7C": 1, "7F": 2, "7E": 3, "79": 4,
  "78": 5, "7B": 6, "7A": 7, "75": 8, "74": 9,
}

const decodeDigits = text => {
  const firstDigit  = text.substring(0,2)
  const secondDigit = text.substring(2,4)

  return `${FIRST_DIGIT_MAP[firstDigit]}${SECOND_DIGIT_MAP[secondDigit]}`
}