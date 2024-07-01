import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';
import { toast } from 'react-toastify';
import { Form } from '@components/common/form/Form';
import SettingMenu from '@components/admin/setting/SettingMenu';
import Button from '@components/common/form/Button';

function SliderSetting(props) {
  const { sliders: slidersSetting, imageUploadUrl } = props;

  const refs = useRef([]);

  const [sliders, setSliders] = useState(
    slidersSetting && slidersSetting.length !== 0
      ? slidersSetting
      : [
          {
            index: 1,
            sortOrder: 1,
            sliderGroup: null,
            url: null,
            visibility: true,
            imageUrl: null
          }
        ]
  );

  const [loading, setLoading] = useState(false);

  const handleSliderImageChange = (e, index) => {
    e.persist();

    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i += 1) {
      formData.append('images', e.target.files[i]);
    }

    setLoading(true);
    fetch(
      `${imageUploadUrl}/sliders/${
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
          const editedSliders = sliders.map((slider) => {
            if (slider?.index !== index) {
              return slider;
            }

            return {
              ...slider,
              imageUrl: response.data.files[0]?.url
            };
          });

          setSliders(editedSliders);
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

  useEffect(() => {
    refs.current = refs.current.slice(0, sliders.length);
  }, [sliders]);

  const renderSliderCards = () => {
    return (
      <>
        {sliders?.map((slider, index) => {
          return (
            <Card
              key={index}
              title={`Slider ${slider?.index}`}
              className="mb-2"
              actions={[]}
            >
              <Card.Session>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 items-center flex">
                    <h4>URL</h4>
                  </div>
                  <div className="col-span-2">
                    <Field
                      type="text"
                      name={`slider${slider?.index}Url`}
                      validationRules={['notEmpty']}
                      placeholder="Example: https://abc.com"
                      value={slider?.url}
                    />
                  </div>
                </div>
              </Card.Session>

              <Card.Session>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 items-center flex">
                    <h4>Group</h4>
                  </div>
                  <div className="col-span-2">
                    <Field
                      name={`slider[${index}]GroupBelong`}
                      validationRules={['notEmpty']}
                      value={
                        variant?.attributes.find(
                          (v) => v.attributeCode === a.attributeCode
                        )?.optionId
                      }
                      options={}
                      type="select"
                    />
                    {/* <Field
                      type="text"
                      name={`slider${slider?.index}SortOrder`}
                      validationRules={['notEmpty']}
                      placeholder="Example: 1"
                      value={slider?.sortOrder}
                    /> */}
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
                      name={`slider${slider?.index}SortOrder`}
                      validationRules={['notEmpty']}
                      placeholder="Example: 1"
                      value={slider?.sortOrder}
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
                      name={`slider${slider?.index}Visibility`}
                      value={slider?.visibility}
                      type="toggle"
                      validationRules={['notEmpty']}
                    />
                  </div>
                </div>
              </Card.Session>

              <Card.Session
                title="Image"
                actions={
                  slider?.imageUrl
                    ? [
                        {
                          name: 'Change',
                          onAction: () => refs.current[index].click()
                        },
                        {
                          name: 'Remove',
                          variant: 'critical',
                          onAction: () => {
                            const mappedSliders = sliders.map((s) => {
                              if (s?.index === slider?.index) {
                                s.imageUrl = undefined;
                              }

                              return s;
                            });

                            setSliders(mappedSliders);
                          }
                        }
                      ]
                    : []
                }
              >
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 items-center flex" />
                  <div className="col-span-2">
                    {!slider?.imageUrl ? (
                      <label
                        htmlFor={`slider${slider?.index}Upload`}
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
                      <div className="category-image">
                        <img src={slider?.imageUrl} alt={' '} />
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
                  id={`slider${slider?.index}Upload`}
                  type="file"
                  onChange={(e) => handleSliderImageChange(e, slider.index)}
                  ref={(el) => (refs.current[index] = el)}
                />
              </div>

              <Field
                type="hidden"
                name={`slider${slider?.index}ImageUrl`}
                value={slider?.imageUrl || ''}
                validationRules={['notEmpty']}
              />

              <Field
                type="hidden"
                name={`slider${slider?.index}Index`}
                value={slider?.index}
                validationRules={['notEmpty']}
              />
            </Card>
          );
        })}

        <Button
          title="Add Slider"
          onAction={() => {
            setSliders([
              ...sliders,
              {
                index: sliders.length + 1,
                sortOrder: sliders.length + 1,
                url: '',
                visibility: true,
                imageUrl: null
              }
            ]);
          }}
        />
      </>
    );
  };

  return renderSliderCards();
}
export default function SliderSettings(props) {
  const { saveSettingApi, imageUploadUrl, sliders } = props;

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-2 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form
            id="sliderSettingsForm"
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
            <SliderSetting sliders={sliders} imageUploadUrl={imageUploadUrl} />
          </Form>
        </div>
      </div>
    </div>
  );
}

SliderSettings.propTypes = {
  saveSettingApi: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 14
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
    sliders {
      index
      sortOrder
      visibility
      url
      imageUrl
    }
    sliderGroups {
      name
    }
    imageUploadUrl: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
  }
`;
