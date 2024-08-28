import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';
import { toast } from 'react-toastify';
import { Form } from '@components/common/form/Form';
import SettingMenu from '@components/admin/setting/SettingMenu';
import Button from '@components/common/form/Button';
function SocialLinkSettingV2(props) {
  const { setting, imageUploadUrl } = props;
  const { social } = setting;

  const refs = useRef([]);

  const [socialLinks, setSocialLinks] = useState(
    social && social.length !== 0
      ? social
      : [
          {
            index: 1,
            name: '',
            sortOrder: 1,
            url: '',
            visibility: true,
            icon: ''
          }
        ]
  );

  const [loading, setLoading] = useState(false);

  const handleSocialImageChange = (e, index) => {
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
          const editedSocialLinks = socialLinks.map((socialLink) => {
            if (socialLink?.index !== index) {
              return socialLink;
            }

            return {
              ...socialLink,
              icon: response.data.files[0]?.url
            };
          });

          setSocialLinks(editedSocialLinks);
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

  const handleRemoveSocialLink = (index) => {
    setSocialLinks(
      socialLinks.filter((socialLink) => socialLink?.index !== index)
    );

    toast.success('Removed');
  };

  useEffect(() => {
    refs.current = refs.current.slice(0, socialLinks.length);
  }, [socialLinks]);

  const renderSocialCards = () => {
    return (
      <>
        {socialLinks?.map((socialLink, index) => {
          return (
            <div key={socialLink?.index} style={{ marginBottom: '16px' }}>
              <Card
                key={socialLink?.index}
                title={
                  <div className="flex justify-between items-center">
                    <h3>{`Social ${index + 1}`}</h3>

                    {socialLinks && (
                      <Button
                        variant="delete"
                        title="Delete"
                        onAction={() =>
                          handleRemoveSocialLink(socialLink?.index)
                        }
                      />
                    )}
                  </div>
                }
                className="mb-2"
                actions={[]}
              >
                <Card.Session>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 items-center flex">
                      <h4>Name</h4>
                    </div>
                    <div className="col-span-2">
                      <Field
                        type="text"
                        name={`social${socialLink?.index}Name`}
                        placeholder="Example: Facebook | Instagram | Twitter"
                        value={socialLink?.name}
                      />
                    </div>
                  </div>
                </Card.Session>

                <Card.Session>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 items-center flex">
                      <h4>URL</h4>
                    </div>
                    <div className="col-span-2">
                      <Field
                        type="text"
                        name={`social${socialLink?.index}Url`}
                        placeholder="Example: https://abc.com"
                        value={socialLink?.url}
                      />
                    </div>
                  </div>
                </Card.Session>

                <Card.Session>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 items-center flex">
                      <h4>Sort Order</h4>
                    </div>
                    <div className="col-span-2">
                      <Field
                        type="text"
                        name={`social${socialLink?.index}SortOrder`}
                        validationRules={['notEmpty']}
                        placeholder="Example: 1"
                        value={socialLink?.sortOrder}
                      />
                    </div>
                  </div>
                </Card.Session>

                <Card.Session>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 items-center flex">
                      <h4>Visibility</h4>
                    </div>
                    <div className="col-span-2">
                      <Field
                        name={`social${socialLink?.index}Visibility`}
                        value={socialLink?.visibility}
                        type="toggle"
                        validationRules={['notEmpty']}
                      />
                    </div>
                  </div>
                </Card.Session>

                <Card.Session
                  title="Image"
                  actions={
                    socialLink?.icon
                      ? [
                          {
                            name: 'Change',
                            onAction: () => refs.current[index].click()
                          }
                        ]
                      : []
                  }
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 items-center flex" />
                    <div className="col-span-2">
                      {!socialLink?.icon ? (
                        <label
                          htmlFor={`social${socialLink?.index}Upload`}
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
                              onAction={() => refs.current[index].click()}
                            />
                          </div>
                          <div className="flex justify-center mt-1">
                            <span
                              style={{ color: '#6d7175', fontSize: '1.2rem' }}
                            >
                              click to upload an image
                            </span>
                          </div>
                        </label>
                      ) : (
                        <div>
                          <img src={socialLink?.icon} alt={'Social Icon'} />
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

                <div
                  className="invisible"
                  style={{ width: '1px', height: '1px' }}
                >
                  <input
                    id={`social${socialLink?.index}Upload`}
                    type="file"
                    onChange={(e) =>
                      handleSocialImageChange(e, socialLink.index)
                    }
                    ref={(el) => (refs.current[index] = el)}
                  />
                </div>

                <Field
                  type="hidden"
                  name={`social${socialLink?.index}IconUrl`}
                  value={socialLink?.icon || ''}
                  validationRules={['notEmpty']}
                />

                <Field
                  type="hidden"
                  name={`social${socialLink?.index}Index`}
                  value={socialLink?.index}
                  validationRules={['notEmpty']}
                />
              </Card>
            </div>
          );
        })}

        <Button
          title="Add Social"
          onAction={() => {
            setSocialLinks([
              ...socialLinks,
              {
                index: Math.max(...socialLinks.map((s) => s?.index)) + 1,
                sortOrder: Math.max(...socialLinks.map((s) => s?.index)) + 1,
                title: '',
                visibility: true,
                url: '',
                icon: ''
              }
            ]);
          }}
        />
      </>
    );
  };

  return renderSocialCards();
}
export default function SocialLinkSettingsV2(props) {
  const { saveSettingApi, imageUploadUrl, setting } = props;

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-2 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form
            id="social-setting-form"
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
            <SocialLinkSettingV2
              setting={setting}
              imageUploadUrl={imageUploadUrl}
            />
          </Form>
        </div>
      </div>
    </div>
  );
}

SocialLinkSettingsV2.propTypes = {
  saveSettingApi: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 14
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      social {
        url
        index
        name
        icon
        sortOrder
        visibility
      }
    }
    imageUploadUrl: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
  }
`;
