import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';
import { toast } from 'react-toastify';
import { get } from '@evershop/evershop/src/lib/util/get';

export function CouponImage({ imageUrl, imageUploadUrl }) {
  // eslint-disable-next-line react/prop-types
  const [loading, setLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState(imageUrl);
  const uploadRef = useRef(null);

  const handleSocialImageChange = (e) => {
    e.persist();

    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i += 1) {
      formData.append('images', e.target.files[i]);
    }

    setLoading(true);
    fetch(
      `${imageUploadUrl}/coupon/${
        Math.floor(Math.random() * (9999 - 1000)) + 1000
      }`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    )
      .then((response) => {
        if (
          !response.headers.get('content-type') ||
          !response.headers.get('content-type').includes('application/json')
        ) {
          throw new TypeError('Something wrong. Please try again');
        }

        return response.json();
      })
      .then((response) => {
        if (!response.error) {
          console.log('response', response.data.files[0]);
          setCurrentImg(response?.data?.files[0]?.url);
        } else {
          toast.error(get(response, 'error.message', 'Failed!'));
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        e.target.value = null;
        setLoading(false);
      });
  };

  return (
    <div className="grid grid-cols-3 gap-2 form-field-container">
      <Card.Session
        title="Image"
        actions={[
          {
            name: 'Change',
            onAction: () => uploadRef.current.click()
          }
        ]}
      >
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex" />
          <div className="col-span-2">
            {!!currentImg === false ? (
              // eslint-disable-next-line jsx-a11y/label-has-associated-control
              <label
                htmlFor={`couponUpload`}
                className="flex flex-col justify-center image-uploader"
              >
                <div className="uploader-icon flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex justify-center">
                  <input
                    id={`couponAdd`}
                    type="file"
                    onChange={(e) => handleSocialImageChange(e)}
                  />
                </div>
                <div className="flex justify-center mt-1">
                  <span style={{ color: '#6d7175', fontSize: '1.2rem' }}>
                    click to upload an image
                  </span>
                </div>
              </label>
            ) : (
              <div>
                <img src={currentImg ?? '#'} alt="Coupon image" />
              </div>
            )}
            {loading === true && (
              <div className="category__image__loading flex justify-center">
                <div className="self-center">
                  <svg
                    style={{
                      display: 'block',
                      shapeRendering: 'auto'
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="10"
                      r="43"
                      strokeDasharray="202.63272615654165 69.54424205218055"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        repeatCount="indefinite"
                        dur="1s"
                        values="0 50 50;360 50 50"
                        keyTimes="0;1"
                      />
                    </circle>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card.Session>
      <div className="invisible" style={{ width: '1px', height: '1px' }}>
        <input
          ref={uploadRef}
          id="couponUpload"
          type="file"
          onChange={(e) => handleSocialImageChange(e)}
        />
        <Field
          style={{ opacity: 0 }}
          value={currentImg ? new URL(currentImg).pathname : ''}
          type="text"
          name="couponImage"
          placeholder="Img"
          label="Img"
        />
      </div>
    </div>
  );
}

CouponImage.propTypes = {
  ImageUrl: PropTypes.string
};

CouponImage.defaultProps = {
  ImageUrl: ''
};
