import PropTypes from 'prop-types';
import React from 'react';
import { useCheckout } from '@components/common/context/checkout';
import useSWRImmutable from "swr/immutable";
const getPayIntentsEndpoint = "http://localhost:3010/api/getPaymentMethods";
const initiatePayEndpoint = "http://localhost:3010/api/initiatePayment";
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";
import AdyenLogo from '../StripeLogo';

// Calls your server endpoints
async function callServer(url, orderId, additionalData) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ ...additionalData, order_id: orderId }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await res.json();
}
// Event handlers called when the shopper selects the pay button,
// or when additional information is required to complete the payment
async function handleSubmission(state, orderId, url, checkoutSuccessUrl) {
  try {
    await callServer(url, orderId, state.data);
    window.location.href = `${checkoutSuccessUrl}/${orderId}`;

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

const fetcher = async ([url, additionalParam]) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ additionalParam })
  });
  return await response.json();
};

export default function AdyenPaymentMethod() {
  const checkout = useCheckout();
  const {
    paymentMethods,
    setPaymentMethods,
    orderPlaced,
    orderId,
    checkoutSuccessUrl
  } = checkout;
  // Get the selected payment method
  const selectedPaymentMethod = paymentMethods
    ? paymentMethods.find((paymentMethod) => paymentMethod.selected)
    : undefined;

  const { data: session, error } = useSWRImmutable([getPayIntentsEndpoint, orderId], fetcher);
  const paymentContainer = React.useRef(null);

  const [adyenState, setAdyenState] = React.useState({});

  React.useEffect(() => {
    if (orderId) {
      // Redirect customer to checkout success page
    }
  }, [orderId]);

  React.useEffect(() => {
    let ignore = false;

    if (!session || !paymentContainer.current) {
      return;
    }

    async function submit() {
      document
        .getElementById('checkoutPaymentForm')
        .dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true })
        );
    }

    const configuration = {
      paymentMethodsResponse: session,
      environment: 'TEST',
      clientKey: 'test_7WZH6GQVZZHRLLNGX5ORJY4NRYQL6D3Z',
      locale: "en_US",
      environment: "test",
      showPayButton: true,
      paymentMethodsConfiguration: {
        ideal: {
          showImage: true,
        },
        card: {
          hasHolderName: true,
          holderNameRequired: true,
          name: "Credit or debit card",
          amount: {
            value: 1000,
            currency: "USD",
          },
        },
      },
      onSubmit: async (state, component) => {
        await submit();
        if (state.isValid) {
          setAdyenState(state);
          // handleSubmission(state, component, "/api/initiatePayment");
        }
      }
    };
    console.log('config==========', configuration);
    const createCheckout = async () => {
      const checkout = await AdyenCheckout(
        configuration
        // onPaymentCompleted: (response, _component) => {
        // TODO: for session only
        // if (response.resultCode !== "Authorised") {
        //   alert(`Unhandled payment result "${response.resultCode}!"`);
        //   return;
        // }
        // document
        //   .getElementById('checkoutPaymentForm')
        //   .dispatchEvent(
        //     new Event('submit', { cancelable: true, bubbles: true })
        //   );
        // },
        // onError: (error, _component) => {
        //   alert(`Error: ${error.message}`);
        // },
      );

      // The 'ignore' flag is used to avoid double re-rendering caused by React 18 StrictMode
      // More about it here: https://beta.reactjs.org/learn/synchronizing-with-effects#fetching-data
      if (paymentContainer.current && !ignore) {
        console.log('create checkout at the end');
        checkout.create("dropin").mount(paymentContainer.current);
      }
    };

    createCheckout();

    return () => {
      ignore = true;
    };

  }, [session]);

  React.useEffect(() => {
    const pay = () => {
      handleSubmission(adyenState, orderId, initiatePayEndpoint, checkoutSuccessUrl);
    };
    console.log(orderId, 'condition important==========', adyenState);

    if (orderPlaced === true && orderId && adyenState && Object.keys(adyenState).length > 0) {
      pay();
    }
  }, [orderPlaced, orderId, adyenState]);


  return (
    <div className='flex flex-col gap-[20px]'>
      <div className="flex justify-start items-center gap-1">
        {(!selectedPaymentMethod || selectedPaymentMethod.code !== 'adyen') && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPaymentMethods((previous) =>
                previous.map((paymentMethod) => {

                  if (paymentMethod.code === 'adyen') {
                    return {
                      ...paymentMethod,
                      selected: true
                    };
                  } else {
                    return {
                      ...paymentMethod,
                      selected: false
                    };
                  }
                })
              );
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
          </a>
        )}
        {selectedPaymentMethod && selectedPaymentMethod.code === 'adyen' && (
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2c6ecb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        )}
        <div>
          <AdyenLogo width={100} />
        </div>
      </div>
      <div>
        <div style={{
          display: selectedPaymentMethod && selectedPaymentMethod.code === 'adyen' ? 'block' : 'none'
        }}>
          <div className="payment-container">
            <div ref={paymentContainer} className="payment"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'checkoutPaymentMethodadyen',
  sortOrder: 10
};
