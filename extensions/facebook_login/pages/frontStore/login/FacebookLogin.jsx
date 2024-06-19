import React from 'react';
import PropTypes from 'prop-types';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import './FacebookLogin.scss';

function FacebookIcon({ width, height }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="LgbsSe-Bz112c"
      viewBox="0 0 48 48"
      width={width}
      height={height}
    >
      <path
        fill="#4267B2"
        d="M24 48c13.255 0 24-10.745 24-24S37.255 0 24 0 0 10.745 0 24s10.745 24 24 24z"
      />
      <path
        fill="#fff"
        d="M29.27 24.028h-4.224v12.495h-6.23V24.028h-2.965v-4.392h2.965V16.66c0-2.472 1.17-6.34 6.34-6.34l4.65.018v5.164h-3.376c-.55 0-1.327.276-1.327 1.45v3.683h4.713l-.546 4.392z"
      />
    </svg>
  );
}

FacebookIcon.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number
};

FacebookIcon.defaultProps = {
  width: 24,
  height: 24
};

function FacebookLogin({ authUrl }) {
  return (
    <div>
      <a href={authUrl} className="facebook__login__button">
        <FacebookIcon />
        {_('Sign in with Facebook')}
      </a>
    </div>
  );
}

FacebookLogin.propTypes = {
  authUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'loginFormInner',
  sortOrder: 25
};

export const query = `
  query Query {
    authUrl: url(routeId: "facebookAuth")
  }
`;

export default FacebookLogin;
