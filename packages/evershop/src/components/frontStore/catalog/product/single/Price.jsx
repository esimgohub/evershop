import PropTypes from 'prop-types';
import React from 'react';

export function Price({ regular, oldPrice }) {
  return (
    <h4 className="product-single-price">
      <div>
        <span className="sale-price">{regular.text}</span>
      </div>
      {/* {oldPrice.value === regular.value && (
        <div>
          <span className="sale-price">{regular.text}</span>
        </div>
      )}
      {oldPrice.value < regular.value && (
        <div>
          <span className="sale-price">{oldPrice.text}</span>{' '}
          <span className="regular-price">{regular.text}</span>
        </div>
      )} */}
    </h4>
  );
}

Price.propTypes = {
  regular: PropTypes.shape({
    value: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired
  }).isRequired,
  oldPrice: PropTypes.shape({
    value: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired
  }).isRequired
};
