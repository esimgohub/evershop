/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModal } from '@components/common/modal/useModal';
import { Card } from '@components/admin/cms/Card';
import Button from '@components/common/form/Button';

export function DeepLinkModal({
    title,
    content,
    webPageUrl,
    // appUrl,
}) {
  const modal = useModal();

  useEffect(() => {
    modal.openModal();
  }, [])

  const handleNavigate = () => {
    window.open(webPageUrl, '_blank');
    modal.closeModal();
  }

  return modal.state.showing && (
    <div>
        <div className={modal.className}>
          <div
            className="modal-wrapper flex self-center justify-center items-center"
            tabIndex={-1}
            role="dialog"
          >
            <div className="modal">
                <Card title={title}>
                    <div className="modal-content">
                        <Card.Session title={content}>
                          <div className="flex justify-between gap-2">
                            <Button title="To Web Page" className="w-full" variant="secondary" onAction={handleNavigate} />
                            <Button title="To App" className="w-full" variant="primary" onAction={handleNavigate} />
                          </div>
                        </Card.Session>
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
    // appUrl: PropTypes.string.isRequired
};