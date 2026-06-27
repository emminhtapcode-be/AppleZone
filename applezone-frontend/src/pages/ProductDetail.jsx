import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <h2>Chi tiết sản phẩm</h2>
      <p>Hiển thị thông tin chi tiết cho sản phẩm có ID: {id}</p>
    </div>
  );
};

export default ProductDetail;
