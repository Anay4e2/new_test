import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

interface Diamond {
  _id: string;
  sku: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  listing_price: number;
  is_sold_out: boolean;
}

const Diamonds: React.FC = () => {
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDiamond, setNewDiamond] = useState({
    sku: '',
    shape: 'Round',
    carat: 0,
    color: 'D',
    clarity: 'FL',
    cost_price: 0,
    margin_percentage: 10
  });

  const fetchDiamonds = async () => {
    try {
      const { data } = await axios.get('/api/diamonds');
      setDiamonds(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching diamonds:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiamonds();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDiamond(prev => ({
      ...prev,
      [name]: name === 'carat' || name === 'cost_price' || name === 'margin_percentage' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get token from local storage for auth
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      await axios.post('/api/diamonds', newDiamond, config);
      setShowAddForm(false);
      fetchDiamonds();
      // Reset form
      setNewDiamond({
        sku: '',
        shape: 'Round',
        carat: 0,
        color: 'D',
        clarity: 'FL',
        cost_price: 0,
        margin_percentage: 10
      });
    } catch (error) {
      console.error('Error adding diamond:', error);
      alert('Failed to add diamond');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Diamond Inventory</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Add Diamond
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Diamond</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input type="text" name="sku" value={newDiamond.sku} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shape</label>
              <select name="shape" value={newDiamond.shape} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                {['Round', 'Princess', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Cushion'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Carat</label>
              <input type="number" step="0.01" name="carat" value={newDiamond.carat} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <select name="color" value={newDiamond.color} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clarity</label>
              <select name="clarity" value={newDiamond.clarity} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                {['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost Price</label>
              <input type="number" name="cost_price" value={newDiamond.cost_price} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Margin (%)</label>
              <input type="number" name="margin_percentage" value={newDiamond.margin_percentage} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div className="md:col-span-3 flex justify-end">
               <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Save Diamond</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading inventory...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shape</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clarity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {diamonds.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No diamonds found</td></tr>
              ) : (
                diamonds.map((diamond) => (
                  <tr key={diamond._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{diamond.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{diamond.shape}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{diamond.carat}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{diamond.color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{diamond.clarity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${diamond.listing_price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${diamond.is_sold_out ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {diamond.is_sold_out ? 'Sold Out' : 'Available'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Diamonds;
