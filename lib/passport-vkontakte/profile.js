/**
 * Parse profile.
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */
exports.parse = function(json) {
  if ('string' == typeof json) {
    json = JSON.parse(json);
  }

  var profile = {};
  profile.id = json.id;
  profile.displayName = json.first_name + ' ' + json.last_name;
  profile.name = { familyName: json.last_name,
                   givenName: json.first_name };

  if (json.sex) {
    profile.gender = json.sex == 1 ? 'female' : 'male';
  }

  var sex = json.sex;
  profile.gender = sex == 1 ? 'female' : sex == 2 ? 'male' : void(1);
  profile.profileUrl = 'http://vk.com/' + json.screen_name;
  profile.photos = [];

  for (var key in json) {
    if (key.indexOf('photo') !== 0) continue;
    profile.photos.push({
      value: json[key],
      type: key
    });
  }

  return profile;
};
