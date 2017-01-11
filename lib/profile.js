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
  profile.username = json.screen_name;
  profile.displayName = json.first_name + ' ' + json.last_name;
  profile.name = { familyName: json.last_name,
                   givenName: json.first_name };
  if (json.nickname){
    profile.name.middleName = json.nickname;
  }

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

  if (json.city) {
    profile.city = json.city.title;
  }

  var bdate = /^(\d+)\.(\d+)\.(\d+)$/.exec(json.bdate);
  if (bdate) {
    var year = bdate[3]
      , month = (bdate[2].length < 2 ? '0' : '') + bdate[2]
      , day = (bdate[1].length < 2 ? '0' : '') + bdate[1];
    profile.birthday = year + '-' + month + '-' + day;
  }

  return profile;
};
