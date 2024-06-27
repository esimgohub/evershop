/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import PropTypes from 'prop-types';
import { useModal } from '@components/common/modal/useModal';
import { Card } from '@components/admin/cms/Card';
import Button from '@components/common/form/Button';

export function DeepLinkModal({
    title,
    content,
    webPageUrl,
    appUrl,
}) {
  const modal = useModal();

  return (
    <div>
        <div className={modal.className}>
          <div
            className="modal-wrapper flex self-center justify-center items-center"
            tabIndex={-1}
            role="dialog"
          >
            <div className="modal">
              {/* <Form id="variantForm" submitBtn={false}>
                <Card title="Create a new variant">
                  <Card.Session>
                    <VariantModal
                      productId={productId}
                      productUuid={productUuid}
                      variantAttributes={variantGroup.attributes}
                      productImageUploadUrl={productImageUploadUrl}
                    />
                  </Card.Session>
                  <Card.Session>
                    <div className="flex justify-end">
                      <div className="grid grid-cols-2 gap-1">
                        <SubmitButton
                          productId={productId}
                          productUuid={productUuid}
                          attributes={variantGroup.attributes}
                          createProductApi={createProductApi}
                          addVariantItemApi={addVariantItemApi}
                          productFormContextDispatch={
                            productFormContextDispatch
                          }
                          modal={modal}
                          refresh={refresh}
                        />
                        <Button
                          title="Cancel"
                          variant="secondary"
                          onAction={modal.closeModal}
                        />
                      </div>
                    </div>
                  </Card.Session>
                </Card>
              </Form> */}
              {/* <button>
                Go to web page
              </button>

              <button>
                Go to app
              </button> */}

                <Card title="Select Products">
                    <div className="modal-content">
                        <Button title="Close" variant="secondary" onAction={closeModal} />
                    </div>
                </Card>
            </div>
          </div>
        </div>
    </div>
  );
}

DeepLinkModal.propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    webPageUrl: PropTypes.string.isRequired,
    appUrl: PropTypes.string.isRequired
};