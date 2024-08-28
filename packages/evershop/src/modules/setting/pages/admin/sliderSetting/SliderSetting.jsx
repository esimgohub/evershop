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
            title: '',
            description: '',
            sortOrder: 1,
            group: '',
            url: '',
            visibility: true,
            imageUrl: ''
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

  const handleRemoveSlider = (index) => {
    setSliders(sliders.filter((slider) => slider?.index !== index));

    toast.success('Removed');
  };

  const renderSliderCards = () => {
    console.log('sliders render: ', sliders);

    return (
      <>
        {sliders?.map((slider, index) => {
          return (
            <div key={slider?.index} style={{ marginBottom: '16px' }}>
              <Card
                key={slider?.index}
                title={
                  <div className="flex justify-between items-center">
                    <h3>{`Slider ${index + 1}`}</h3>

                    {sliders.length > 1 && (
                      <Button
                        variant="delete"
                        title="Delete"
                        onAction={() => handleRemoveSlider(slider?.index)}
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
                      <h4>Title</h4>
                    </div>
                    <div className="col-span-2">
                      <Field
                        type="text"
                        name={`1sslideritem${slider?.index}Title`}
                        placeholder="Example: https://abc.com"
                        value={slider?.title}
                      />
                      {/* <CkeditorField
                        id={`1sslideritem${slider?.index}Title`}
                        name={`1sslideritem${slider?.index}Title`}
                        value={slider.title ? unescape(slider.title) : ''}
                        browserApi={browserApi}
                        deleteApi={deleteApi}
                        uploadApi={uploadApi}
                        folderCreateApi={folderCreateApi}
                      /> */}
                    </div>
                  </div>
                </Card.Session>

                <Card.Session>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 items-center flex">
                      <h4>Description</h4>
                    </div>
                    <div className="col-span-2">
                      <Field
                        type="text"
                        name={`1sslideritem${slider?.index}Description`}
                        placeholder="Example: https://abc.com"
                        value={slider?.description}
                      />
                      {/* <CkeditorField
                        id={`1sslideritem${slider?.index}Description`}
                        name={`1sslideritem${slider?.index}Description`}
                        value={
                          slider.description ? unescape(slider.description) : ''
                        }
                        browserApi={browserApi}
                        deleteApi={deleteApi}
                        uploadApi={uploadApi}
                        folderCreateApi={folderCreateApi}
                      /> */}
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
                        name={`1sslideritem${slider?.index}Url`}
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
                        name={`1sslideritem${slider?.index}Group`}
                        validationRules={['notEmpty']}
                        value={slider?.group ?? ''}
                        type="text"
                        formId="slider-setting-form"
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
                        name={`1sslideritem${slider?.index}SortOrder`}
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
                        name={`1sslideritem${slider?.index}Visibility`}
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
                          htmlFor={`sliderItem${slider?.index}Upload`}
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
                          <img src={slider?.imageUrl} alt={'Slider Image'} />
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
                    id={`sliderItem${slider?.index}Upload`}
                    type="file"
                    onChange={(e) => handleSliderImageChange(e, slider.index)}
                    ref={(el) => (refs.current[index] = el)}
                  />
                </div>

                <Field
                  type="hidden"
                  name={`1sslideritem${slider?.index}ImageUrl`}
                  value={slider?.imageUrl || ''}
                  validationRules={['notEmpty']}
                />

                <Field
                  type="hidden"
                  name={`1sslideritem${slider?.index}Index`}
                  value={slider?.index}
                  validationRules={['notEmpty']}
                />
              </Card>
            </div>
          );
        })}

        <Button
          title="Add Slider"
          onAction={() => {
            setSliders([
              ...sliders,
              {
                index: Math.max(...sliders.map((s) => s?.index)) + 1,
                sortOrder: Math.max(...sliders.map((s) => s?.index)) + 1,
                url: '',
                visibility: true,
                imageUrl: null,
                title: '',
                description: '',
                group: ''
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
            id="slider-setting-form"
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
      group
      url
      imageUrl
      title
      description
    }
    imageUploadUrl: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
    browserApi: url(routeId: "fileBrowser", params: [{key: "0", value: ""}])
    deleteApi: url(routeId: "fileDelete", params: [{key: "0", value: ""}])
    uploadApi: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
    folderCreateApi: url(routeId: "folderCreate")
  }
`;
