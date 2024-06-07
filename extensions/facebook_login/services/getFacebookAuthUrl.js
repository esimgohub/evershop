module.exports.getFacebookAuthUrl = (client_id, redirect_uri) => {
  const rootUrl = `https://www.facebook.com/v19.0/dialog/oauth`;

  const facebookOauthQueryOptions = {
    redirect_uri,
    client_id,
    state: 'bcxvadasdasdasdasdasda'
  };

  const queryString = new URLSearchParams(facebookOauthQueryOptions).toString();
  return `${rootUrl}?${queryString}`;
};
