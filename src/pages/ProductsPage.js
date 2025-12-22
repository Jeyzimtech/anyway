import React from 'react';
import { useEffect, useState } from 'react';
import { listProducts } from '../lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listProducts();
        setProducts(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{color:'red'}}>Error: {error}</div>;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h2>Products</h2>
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name} — {p.category} — ${p.price}</li>
        ))}
      </ul>
    </div>
  );
}
