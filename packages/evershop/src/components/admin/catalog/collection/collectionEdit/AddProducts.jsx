import PropTypes from 'prop-types';
import React from 'react';
import { toast } from 'react-toastify';
import ProductSkuSelector from '@components/admin/promotion/couponEdit/ProductSkuSelector';

function AddProducts({ addProductApi, addedProductIDs, closeModal }) {
  const [addedProductIds, setAddedProductIds] = React.useState(addedProductIDs);

  const addProduct = async (sku, uuid, productId) => {
    const response = await fetch(addProductApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: uuid
      }),
      credentials: 'include'
    });
    const data = await response.json();
    if (!data.success) {
      toast.error(data.message);
    } else {
      setAddedProductIds([...addedProductIds, uuid]);
    }
  };

  const removeProduct = async (sku, uuid, productId) => {
    const response = await fetch(`${addProductApi}/${uuid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const data = await response.json();
    if (!data.success) {
      toast.error(data.message);
    } else {
      setAddedProductIds(
        addedProductIds.filter((productId) => productId !== uuid)
      );
    }
  };

  return (
    <ProductSkuSelector
      onSelect={addProduct}
      closeModal={closeModal}
      selectedChecker={(product) =>
        // eslint-disable-next-line eqeqeq
        addedProductIds.find((id) => id == product.uuid)
      }
      // TODO: Implement un select products
      onUnSelect={removeProduct}
    />
  );
}

AddProducts.propTypes = {
  addProductApi: PropTypes.string.isRequired,
  addedProductIDs: PropTypes.arrayOf(PropTypes.number),
  closeModal: PropTypes.func.isRequired
};

AddProducts.defaultProps = {
  addedProductIDs: []
};

export default AddProducts;
