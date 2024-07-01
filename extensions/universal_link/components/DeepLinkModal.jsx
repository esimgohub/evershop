import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModal } from '@components/common/modal/useModal';
import { Card } from '@components/admin/cms/Card';
import Button from '@components/common/form/Button';

export function DeepLinkModal({
    title,
    webPageUrl,
}) {
  const [countDownTimer, setCountDownTimer] = React.useState(5);
  const modal = useModal();

  useEffect(() => {
    modal.openModal();
  }, [])

  useEffect(() => {
    let timer = setInterval(() => {
      setCountDownTimer(countDownTimer - 1);
    }, 1000);

    if (countDownTimer === 0) {
      clearInterval(timer);
      window.location.href = webPageUrl;
    }

    return () => {
      clearInterval(timer);
    }
  }, [countDownTimer])

  const handleNavigateToWebPage = () => {
    window.location.href = webPageUrl;
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
                        <Card.Session>
                          <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                           }}>

                            <p 
                              style={{
                                marginBottom: '16px'
                              }}
                            >
                              You will be redirected to esimgohub.com after {countDownTimer} second{countDownTimer > 1 ? 's' : ''}
                            </p>

                            <Button title="To page now" style className="w-full" variant="primary" onAction={handleNavigateToWebPage} />
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
    webPageUrl: PropTypes.string.isRequired,
};