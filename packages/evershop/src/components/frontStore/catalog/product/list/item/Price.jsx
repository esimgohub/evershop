import PropTypes from 'prop-types';
import React from 'react';

function Price({ regular, oldPrice }) {
  return (
    <div className="product-price-listing">
      <div>
        <span className="sale-price font-semibold">{regular.text}</span>
      </div>
      {/* {regular.value === oldPrice.value && (
        <div>
          <span className="sale-price font-semibold">{regular.text}</span>
        </div>
      )}
      {oldPrice.value < regular.value && (
        <div>
          <span className="sale-price text-critical font-semibold">
            {oldPrice.text}
          </span>{' '}
          <span className="regular-price font-semibold">{regular.text}</span>
        </div>
      )} */}
    </div>
  );
}

Price.propTypes = {
  regular: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }).isRequired,
  oldPrice: PropTypes.shape({
    value: PropTypes.number,
    text: PropTypes.string
  }).isRequired
};

export { Price };
