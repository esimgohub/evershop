import PropTypes from 'prop-types';
import React from 'react';

function Price({ regular, oldPrice }) {
  return (
    <div className="product-price-listing">
      <div>
        <span className="sale-price font-semibold">{regular.text}</span>
      </div>
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
