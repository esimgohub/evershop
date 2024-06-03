import PropTypes from 'prop-types';
import React from 'react';
import { toast } from 'react-toastify';
import ProductSkuSelector from '@components/admin/promotion/couponEdit/ProductSkuSelector';

function AddProducts({ addProductApi, addedProductIDs, closeModal }) {
  const [addedProducts, setAddedProducts] = React.useState(addedProductIDs);

  const addProduct = async (sku, uuid) => {
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
      setAddedProducts([...addedProducts, data.data.product_id]);
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
      setAddedProducts(
        addedProducts.filter((productId) => productId !== data.data.product_id)
      );
    }
  };

  return (
    <ProductSkuSelector
      onSelect={addProduct}
      closeModal={closeModal}
      selectedChecker={(product) =>
        // eslint-disable-next-line eqeqeq
        addedProducts.find((p) => p == product.uuid)
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
