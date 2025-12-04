import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createShop } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function SetupShop() {
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshShop } = useAuth();

  const generateSlug = (name: string) => {
    return name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .substring(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createShop({
        name: shopName,
        slug: generateSlug(shopName),
      });
      await refreshShop();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome to AutoShop ATS</h2>
          <p className="mt-2 text-gray-600">Let's set up your shop to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
          {error && (
            <div className="bg-red-50 text-red-800 rounded-md p-4">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., JJ Auto Service"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
            {shopName && (
              <p className="mt-1 text-sm text-gray-500">
                Your apply link: /apply?shop={generateSlug(shopName)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !shopName.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Shop'}
          </button>
        </form>
      </div>
    </div>
  );
}
