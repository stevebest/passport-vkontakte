/**
 * Parse profile.
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */
function parse (json) {
  if (typeof json === 'string') {
    json = JSON.parse(json)
  }

  const {
    id,
    screen_name: username,
    first_name: firstName,
    last_name: lastName,
    nickname,
    sex: rawSex,
    city,
    bdate: birthDate,
    ...other
  } = json

  const sex = parseInt(rawSex, 10)
  const photos = []

  for (const [key, value] of Object.entries(other)) {
    if (key.indexOf('photo') !== 0) continue

    photos.push({ value, type: key })
  }

  let birthday = null
  const [, day, month, year] = /^(\d+)\.(\d+)\.(\d+)$/.exec(birthDate) || []

  if (year !== undefined) {
    birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const profile = {
    id,
    username,
    displayName: `${firstName} ${lastName}`,
    city: city?.title || null,
    name: { firstName, middleName: nickname || null, lastName },
    profileUrl: 'https://vk.com/' + username,
    gender: sex === 1 ? 'female' : sex === 2 ? 'male' : undefined,
    photos,
    birthday
  }

  return profile
}

exports.parse = parse
