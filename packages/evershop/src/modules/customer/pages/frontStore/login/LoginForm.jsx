import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Field } from '@components/common/form/Field';
import { Form } from '@components/common/form/Form';
import './LoginForm.scss';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Area from '@components/common/Area';

export default function LoginForm({ sendMagicLink }) {
  console.log('send magic link: ', sendMagicLink);

  const [error, setError] = React.useState(null);
  const [isMagicLoginSuccess, setMagicLoginSuccessStatus] =
    React.useState(false);

  const renderMagicLoginContent = useCallback(() => {
    if (isMagicLoginSuccess) {
      return <p className="text-center">Vui long cho 1 chut nhe</p>;
    }

    return (
      <>
        <h1 className="text-center">{_('Login')}</h1>
        {error && <div className="text-critical mb-1">{error}</div>}
        <Form
          id="loginForm"
          action={sendMagicLink}
          isJSON
          method="POST"
          onSuccess={(response) => {
            console.log('login success: ', response);

            if (response.error) {
              // window.location.href = homeUrl;
              setError(response.error.message);
              return;
            }

            setMagicLoginSuccessStatus(true);
          }}
          btnText={_('SIGN IN')}
        >
          <Area
            id="loginFormInner"
            coreComponents={[
              {
                component: { default: Field },
                props: {
                  name: 'email',
                  type: 'text',
                  placeholder: _('Email'),
                  validationRules: ['notEmpty', 'email']
                },
                sortOrder: 10
              }
            ]}
          />
        </Form>
      </>
    );
  }, [sendMagicLink, error, isMagicLoginSuccess]);

  return (
    <div className="flex justify-center items-center">
      <div className="login-form flex justify-center items-center">
        <div className="login-form-inner">{renderMagicLoginContent()}</div>
      </div>
    </div>
  );
}

LoginForm.propTypes = {
  action: PropTypes.string.isRequired,
  homeUrl: PropTypes.string.isRequired,
  registerUrl: PropTypes.string.isRequired,
  forgotPasswordUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    sendMagicLink: url(routeId: "sendMagicLink")
  }
`;
