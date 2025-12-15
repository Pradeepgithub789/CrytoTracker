import { useState, useEffect } from 'react';
import { portfolioAPI, cryptoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaSpinner } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [formData, setFormData] = useState({
    coinId: '',
    coinName: '',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: '',
  });

  useEffect(() => {
    if (user) {
      fetchPortfolio();
      fetchCryptoList();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getAll();
      const data = response.data;

      const updated = await Promise.all(
        data.map(async (item) => {
          try {
            const coin = await cryptoAPI.getCoinDetails(item.coinId);
            const price = coin?.market_data?.current_price?.usd ?? 0;
            return { ...item, currentPrice: price };
          } catch {
            return { ...item, currentPrice: 0 };
          }
        })
      );

      setPortfolio(updated);
    } catch (err) {
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoList = async () => {
    try {
      const list = await cryptoAPI.getAllCryptocurrencies();
      setCryptoList(list || []);
    } catch {
      setCryptoList([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selected = cryptoList.find((c) => c.id === formData.coinId);

    const item = {
      coinId: formData.coinId,
      coinName: formData.coinName || selected?.name,
      symbol: formData.symbol || selected?.symbol.toUpperCase(),
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: formData.purchaseDate,
    };

    try {
      if (editingItem) {
        await portfolioAPI.update(editingItem.id, item);
        toast.success("Updated successfully");
      } else {
        await portfolioAPI.create(item);
        toast.success("Added successfully");
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        coinId: '',
        coinName: '',
        symbol: '',
        quantity: '',
        purchasePrice: '',
        purchaseDate: '',
      });

      fetchPortfolio();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      coinId: item.coinId,
      coinName: item.coinName,
      symbol: item.symbol,
      quantity: item.quantity.toString(),
      purchasePrice: item.purchasePrice.toString(),
      purchaseDate: item.purchaseDate,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await portfolioAPI.delete(id);
      toast.success("Deleted");
      fetchPortfolio();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ---- TOTALS ----
  const totalValue = portfolio.reduce(
    (sum, i) => sum + i.quantity * i.currentPrice,
    0
  );
  const totalCost = portfolio.reduce(
    (sum, i) => sum + i.quantity * i.purchasePrice,
    0
  );
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? ((totalPL / totalCost) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">My Portfolio</h1>
            <p className="text-gray-400">Track your investments</p>
          </div>

          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <FaDownload />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  coinId: '',
                  coinName: '',
                  symbol: '',
                  quantity: '',
                  purchasePrice: '',
                  purchaseDate: '',
                });
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 mb-2">Total Value</p>
            <p className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 mb-2">Total Cost</p>
            <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 mb-2">Profit / Loss</p>
            <p className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPL.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 mb-2">P/L %</p>
            <p className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalPLPercent}%
            </p>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
            <table className="min-w-full text-gray-200">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase">Coin</th>
                  <th className="px-6 py-3 text-left text-xs uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs uppercase">Buy Price</th>
                  <th className="px-6 py-3 text-left text-xs uppercase">Now</th>
                  <th className="px-6 py-3 text-left text-xs uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs uppercase">P/L</th>
                  <th className="px-6 py-3 text-left text-xs uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700">
                {portfolio.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      No items yet.
                    </td>
                  </tr>
                ) : (
                  portfolio.map((item) => {
                    const value = item.quantity * item.currentPrice;
                    const cost = item.quantity * item.purchasePrice;
                    const pl = value - cost;
                    const plPercent = ((pl / cost) * 100).toFixed(2);

                    return (
                      <tr key={item.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-white font-semibold">{item.coinName}</div>
                          <div className="text-sm text-gray-400">{item.symbol}</div>
                        </td>

                        <td className="px-6 py-4">{item.quantity}</td>
                        <td className="px-6 py-4">${item.purchasePrice}</td>
                        <td className="px-6 py-4">${item.currentPrice}</td>
                        <td className="px-6 py-4">${value.toFixed(2)}</td>

                        <td className="px-6 py-4">
                          <span className={`${pl >= 0 ? "text-green-400" : "text-red-400"} font-bold`}>
                            ${pl.toFixed(2)}
                          </span>
                          <div className="text-xs">{plPercent}%</div>
                        </td>

                        <td className="px-6 py-4 flex space-x-3">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-lg p-6">

              <h2 className="text-2xl font-bold text-white mb-4">
                {editingItem ? "Edit Item" : "Add Item"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* FIXED SELECT INPUT */}
                <select
                  className="w-full bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 rounded"
                  value={formData.coinId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const selected = cryptoList.find((c) => c.id === id);

                    setFormData({
                      ...formData,
                      coinId: id,
                      coinName: selected?.name || "",
                      symbol: selected?.symbol?.toUpperCase() || "",
                    });
                  }}
                  required
                >
                  <option value="">Select Crypto</option>
                  {cryptoList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 rounded"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />

                <input
                  type="number"
                  placeholder="Purchase Price"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 rounded"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  required
                />

                <input
                  type="date"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 rounded"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />

                <div className="flex space-x-4 pt-3">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    {editingItem ? "Update" : "Add"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Portfolio;
