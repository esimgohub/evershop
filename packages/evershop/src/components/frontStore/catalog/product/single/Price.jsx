import PropTypes from 'prop-types';
import React from 'react';

export function Price({ regular, special }) {
  console.log('regular: ', regular, 'special: ', special);

  return (
    <h4 className="product-single-price">
      <div>
        <span className="regular-price">{regular.text}</span>
      </div>
    </h4>
  );
}

Price.propTypes = {
  regular: PropTypes.shape({
    value: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired
  }).isRequired,
  special: PropTypes.shape({
    value: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired
  }).isRequired
};
