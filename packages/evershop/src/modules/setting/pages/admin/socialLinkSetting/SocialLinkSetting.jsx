import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';
import { toast } from 'react-toastify';
import { Form } from '@components/common/form/Form';
import SettingMenu from '@components/admin/setting/SettingMenu';
import Button from '@components/common/form/Button';

function SocialLink(props) {
  const { setting, imageUploadUrl } = props;

  console.log('setting: ', setting);

  // const facebookRef = useRef();
  // const instagramRef = useRef();
  // const tiktokRef = useRef();
  // const threadRef = useRef();

  const refs = useRef([]);

  const { social } = setting;

  const [facebookIcon, setFacebookIcon] = useState(social[0]?.icon);
  const [instagramIcon, setInstagramIcon] = useState(social[1]?.icon);
  const [tiktokIcon, setTiktokIcon] = useState(social[2]?.icon);
  const [threadIcon, setThreadIcon] = useState(social[3]?.icon);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refs.current = refs.current.slice(0, sliders.length);
  }, [sliders]);

  const handleFacebookIconChange = (e) => {
    e.persist();
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i += 1) {
      formData.append('images', e.target.files[i]);
    }

    setLoading(true);
    fetch(
      `${imageUploadUrl}/social/${
        Math.floor(Math.random() * (9999 - 1000)) + 1000
      }/${Math.floor(Math.random() * (9999 - 1000)) + 1000}`,
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
          setFacebookIcon(response.data.files[0].url);
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

  const handleInstagramIconChange = (e) => {
    e.persist();
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i += 1) {
      formData.append('images', e.target.files[i]);
    }
    setLoading(true);
    fetch(
      `${imageUploadUrl}/social/${
        Math.floor(Math.random() * (9999 - 1000)) + 1000
      }/${Math.floor(Math.random() * (9999 - 1000)) + 1000}`,
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
          setInstagramIcon(response.data.files[0].url);
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

  const handleTiktokIconChange = (e) => {
    e.persist();
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i += 1) {
      formData.append('images', e.target.files[i]);
    }
    setLoading(true);
    fetch(
      `${imageUploadUrl}/social/${
        Math.floor(Math.random() * (9999 - 1000)) + 1000
      }/${Math.floor(Math.random() * (9999 - 1000)) + 1000}`,
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
          setTiktokIcon(response.data.files[0].url);
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

  const handleThreadIconChange = (e) => {
    e.persist();
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i += 1) {
      formData.append('images', e.target.files[i]);
    }
    setLoading(true);
    fetch(
      `${imageUploadUrl}/social/${
        Math.floor(Math.random() * (9999 - 1000)) + 1000
      }/${Math.floor(Math.random() * (9999 - 1000)) + 1000}`,
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
          setThreadIcon(response.data.files[0].url);
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
    <>
      <Card
        title="Social 1"
        className="mb-2"
        actions={
          facebookIcon
            ? [
                { name: 'Change', onAction: () => facebookRef.current.click() },
                {
                  name: 'Remove',
                  variant: 'critical',
                  onAction: () => {
                    setFacebookIcon(undefined);
                  }
                }
              ]
            : []
        }
      >
        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex">
              <h4>Url</h4>
            </div>
            <div className="col-span-2">
              <Field
                type="text"
                name="facebookUrl"
                placeholder="Facebook"
                value={social[0].url}
              />
            </div>
          </div>
        </Card.Session>

        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex" />
            <div className="col-span-2">
              {!facebookIcon ? (
                <label
                  htmlFor="facebookIconUpload"
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
                    <Button
                      title="Add image"
                      variant="default"
                      onAction={() => facebookRef.current.click()}
                    />
                  </div>
                  <div className="flex justify-center mt-1">
                    <span style={{ color: '#6d7175', fontSize: '1.2rem' }}>
                      click to upload an image
                    </span>
                  </div>
                </label>
              ) : (
                <div className="category-image">
                  <img src={facebookIcon} alt={' '} />
                </div>
              )}

              {loading === true && (
                <div className="category__image__loading flex justify-center">
                  <div className="self-center">
                    <svg
                      style={{ display: 'block', shapeRendering: 'auto' }}
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
            id="social1IconUpload"
            type="file"
            onChange={handleFacebookIconChange}
            ref={facebookRef}
          />
        </div>

        <Field type="hidden" name="social1IconUrl" value={facebookIcon || ''} />
      </Card>

      <Card
        title="Instagram"
        className="mb-2!"
        actions={
          instagramIcon
            ? [
                {
                  name: 'Change',
                  onAction: () => instagramRef.current.click()
                },
                {
                  name: 'Remove',
                  variant: 'critical',
                  onAction: () => {
                    setInstagramIcon(undefined);
                  }
                }
              ]
            : []
        }
      >
        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex">
              <h4>Instagram</h4>
            </div>
            <div className="col-span-2">
              <Field
                type="text"
                name="instagramUrl"
                placeholder="Instagram"
                value={social[2]?.url}
              />
            </div>
          </div>
        </Card.Session>

        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex" />
            <div className="col-span-2">
              {!instagramIcon ? (
                <label
                  htmlFor="instagramIconUpload"
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
                    <Button
                      title="Add image"
                      variant="default"
                      onAction={() => instagramRef.current.click()}
                    />
                  </div>
                  <div className="flex justify-center mt-1">
                    <span style={{ color: '#6d7175', fontSize: '1.2rem' }}>
                      click to upload an image
                    </span>
                  </div>
                </label>
              ) : (
                <div className="category-image">
                  <img src={instagramIcon} alt={' '} />
                </div>
              )}
            </div>
          </div>
        </Card.Session>

        <div className="invisible" style={{ width: '1px', height: '1px' }}>
          <input
            id="social2IconUpload"
            type="file"
            onChange={handleInstagramIconChange}
            ref={instagramRef}
          />
        </div>

        <Field
          type="hidden"
          name="social2IconUrl"
          value={instagramIcon || ''}
        />
      </Card>

      <Card
        title="Tiktok"
        className="mb-2"
        actions={
          tiktokIcon
            ? [
                { name: 'Change', onAction: () => tiktokRef.current.click() },
                {
                  name: 'Remove',
                  variant: 'critical',
                  onAction: () => {
                    setTiktokIcon(undefined);
                  }
                }
              ]
            : []
        }
      >
        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex">
              <h4>Tiktok</h4>
            </div>
            <div className="col-span-2">
              <Field
                type="text"
                name="social3Url"
                placeholder="Tiktok"
                value={social[3].url}
              />
            </div>
          </div>
        </Card.Session>

        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex" />
            <div className="col-span-2">
              {!tiktokIcon ? (
                <label
                  htmlFor="social3IconUpload"
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
                    <Button
                      title="Add image"
                      variant="default"
                      onAction={() => tiktokRef.current.click()}
                    />
                  </div>
                  <div className="flex justify-center mt-1">
                    <span style={{ color: '#6d7175', fontSize: '1.2rem' }}>
                      click to upload an image
                    </span>
                  </div>
                </label>
              ) : (
                <div className="category-image">
                  <img src={tiktokIcon} alt={' '} />
                </div>
              )}
            </div>
          </div>
        </Card.Session>

        <div className="invisible" style={{ width: '1px', height: '1px' }}>
          <input
            id="social3IconUpload"
            type="file"
            onChange={handleTiktokIconChange}
            ref={tiktokRef}
          />
        </div>

        <Field type="hidden" name="social3IconUrl" value={tiktokIcon || ''} />
      </Card>

      <Card
        title="Thread"
        className="mb-2"
        actions={
          threadIcon
            ? [
                { name: 'Change', onAction: () => threadRef.current.click() },
                {
                  name: 'Remove',
                  variant: 'critical',
                  onAction: () => {
                    setThreadIcon(undefined);
                  }
                }
              ]
            : []
        }
      >
        <div className="invisible" style={{ width: '1px', height: '1px' }}>
          <input
            id="social4IconUpload"
            type="file"
            onChange={handleThreadIconChange}
            ref={threadRef}
          />
        </div>

        <Field type="hidden" name="social4IconUrl" value={threadIcon || ''} />

        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex">
              <h4>Thread</h4>
            </div>
            <div className="col-span-2">
              <Field
                type="text"
                name="social4Url"
                placeholder="Thread"
                value={social[3].url}
              />
            </div>
          </div>
        </Card.Session>

        <Card.Session>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 items-center flex" />
            <div className="col-span-2">
              {!threadIcon ? (
                <label
                  htmlFor="threadIconUpload"
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
                    <Button
                      title="Add image"
                      variant="default"
                      onAction={() => threadRef.current.click()}
                    />
                  </div>
                  <div className="flex justify-center mt-1">
                    <span style={{ color: '#6d7175', fontSize: '1.2rem' }}>
                      click to upload an image
                    </span>
                  </div>
                </label>
              ) : (
                <div className="category-image">
                  <img src={threadIcon} alt={' '} />
                </div>
              )}
            </div>
          </div>
        </Card.Session>
      </Card>
    </>
  );
}
export default function SocialLinkSetting(props) {
  const { saveSettingApi, imageUploadUrl, setting } = props;

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-2 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form
            id="socialLinkSettingForm"
            method="POST"
            action={saveSettingApi}
            onSuccess={(response) => {
              if (!response.error) {
                toast.success('Setting saved');
              } else {
                toast.error(response.error.message);
              }
            }}
          >
            <SocialLink setting={setting} imageUploadUrl={imageUploadUrl} />
          </Form>
        </div>
      </div>
    </div>
  );
}

SocialLinkSetting.propTypes = {
  saveSettingApi: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 12
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      social {
        url
        index
        icon
      }
    }
    imageUploadUrl: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
  }
`;
