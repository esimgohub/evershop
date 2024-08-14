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
      return (
        <h3 className="text-center">
          The message has been sent to your email, please check.
        </h3>
      );
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
          formClassName="rounded-xl"
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
                  label: `${_('Email')}`,
                  placeholder: 'Enter your email address',
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
    <div className="flex w-screen h-screen">
      {/* Left side */}
      <div className="flex w-3/5 justify-center items-center">
        <div className="login-form flex justify-center items-center">
          <div className="login-form-inner">{renderMagicLoginContent()}</div>
        </div>
      </div>

      {/* Right side */}
      <div class="w-2/5 px-[100px] flex items-center justify-center bg-[#43D3FE]">
        <div class="rounded-lg shadow-lg">
          <div class="mb-8">
            {/* <!-- Logo --> */}
            <img
              src="/images/gohub-logo.png"
              className="w-[150px] mb-4"
              alt="Gohub Logo"
            />
            {/* <!-- Illustration --> */}
            <img
              src="https://gohub.cloud/svg/gohub-signIn.svg"
              alt="Travel Illustration"
            />
          </div>

          <h1 class="text-2xl font-bold text-gray-800">
            SEAMLESS NETWORK CONNECTIVITY IN OVER 100 COUNTRIES!
          </h1>

          <p class="mt-4 text-gray-600">
            Become a member of Gohub to easily manage your eSIM like never
            before!
          </p>
        </div>
      </div>
    </div>

    // <div className="flex justify-center items-center">
    //   <div className="login-form flex justify-center items-center">
    //     <div className="login-form-inner">{renderMagicLoginContent()}</div>
    //   </div>
    // </div>

    // <div class="login-form flex w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
    //   <div class="w-full md:w-1/2 p-8">
    //     <div class="flex justify-center mb-4">
    //       <svg
    //         class="w-16 h-16 text-purple-700"
    //         xmlns="http://www.w3.org/2000/svg"
    //         viewBox="0 0 24 24"
    //         fill="currentColor"
    //       >
    //         <path
    //           fill-rule="evenodd"
    //           d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13.5h2v6h-2v-6zm1 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
    //           clip-rule="evenodd"
    //         />
    //       </svg>
    //     </div>
    //     <h2 class="text-2xl font-bold text-center text-gray-700">
    //       Welcome back!
    //     </h2>
    //     <p class="text-sm text-center text-gray-600 mt-2">
    //       Enter to get unlimited access to data & information.
    //     </p>
    //     {/* <form action="#" class="mt-8">
    //             <div>
    //                 <label for="email" class="text-sm font-semibold text-gray-600">Email *</label>
    //                 <input type="email" id="email" class="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md focus:border-purple-500 focus:ring-purple-300 focus:outline-none focus:ring focus:ring-opacity-40"
    //                     placeholder="Enter your mail address" required>
    //             </div>
    //             <div class="mt-4">
    //                 <label for="password" class="text-sm font-semibold text-gray-600">Password *</label>
    //                 <div class="relative">
    //                     <input type="password" id="password" class="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md focus:border-purple-500 focus:ring-purple-300 focus:outline-none focus:ring focus:ring-opacity-40"
    //                         placeholder="Enter password" required>
    //                     <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
    //                         <i class="fas fa-eye-slash text-gray-500"></i>
    //                     </div>
    //                 </div>
    //             </div>
    //             <div class="flex justify-between items-center mt-6">
    //                 <div class="flex items-center">
    //                     <input id="remember" type="checkbox"
    //                         class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2">
    //                     <label for="remember" class="ml-2 text-sm text-gray-600">Remember me</label>
    //                 </div>
    //                 <a href="#" class="text-sm text-purple-600 hover:underline">Forgot your password?</a>
    //             </div>
    //             <div class="mt-6">
    //                 <button
    //                     class="w-full px-4 py-2 text-white bg-purple-700 rounded-md hover:bg-purple-600 focus:outline-none focus:bg-purple-600">Log
    //                     In</button>
    //             </div>
    //         </form> */}
    //     <div className="login-form-inner">{renderMagicLoginContent()}</div>
    //   </div>
    // </div>
  );
}

LoginForm.propTypes = {
  action: PropTypes.string.isRequired,
  homeUrl: PropTypes.string.isRequired,
  registerUrl: PropTypes.string.isRequired,
  forgotPasswordUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'blank-layout-content',
  sortOrder: 10
};

export const query = `
  query Query {
    sendMagicLink: url(routeId: "sendMagicLink")
  }
`;
