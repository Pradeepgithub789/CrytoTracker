import { useState, useEffect } from 'react';
import { alertsAPI, cryptoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaBell, FaSpinner } from 'react-icons/fa';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [formData, setFormData] = useState({
    coinId: '',
    coinName: '',
    symbol: '',
    targetPrice: '',
    condition: 'above',
    isActive: true,
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setCryptoList([]);
      await fetchAlerts();
      await fetchCryptoList();
      setTimeout(checkAlerts, 2000);
    };

    loadData();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoList = async () => {
    try {
      const allCryptos = await cryptoAPI.getAllCryptocurrencies();
      setCryptoList(allCryptos || []);
    } catch (error) {
      setCryptoList([]);
    }
  };

  const checkAlerts = async () => {
    try {
      const response = await alertsAPI.getAll();
      const activeAlerts = response.data.filter((a) => a.isActive);

      for (const alert of activeAlerts) {
        const coinData = await cryptoAPI.getCoinDetails(alert.coinId);
        const price = coinData?.market_data?.current_price?.usd || 0;

        const triggered =
          (alert.condition === 'above' && price >= alert.targetPrice) ||
          (alert.condition === 'below' && price <= alert.targetPrice);

        if (triggered) {
          toast.info(
            `🚨 ${alert.coinName} (${alert.symbol}) is now $${price.toFixed(2)} (${alert.condition} $${alert.targetPrice})`,
            { autoClose: 10000 }
          );
          await alertsAPI.update(alert.id, { ...alert, isActive: false });
          fetchAlerts();
        }
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selected = cryptoList.find((c) => c.id === formData.coinId);
    const alertData = {
      coinId: formData.coinId,
      coinName: formData.coinName || selected?.name,
      symbol: formData.symbol || selected?.symbol.toUpperCase(),
      targetPrice: parseFloat(formData.targetPrice),
      condition: formData.condition,
      isActive: formData.isActive,
    };

    try {
      if (editingAlert) {
        await alertsAPI.update(editingAlert.id, alertData);
        toast.success('Alert updated');
      } else {
        await alertsAPI.create(alertData);
        toast.success('Alert created');
      }
      setShowModal(false);
      setEditingAlert(null);
      setFormData({
        coinId: '',
        coinName: '',
        symbol: '',
        targetPrice: '',
        condition: 'above',
        isActive: true,
      });
      fetchAlerts();
    } catch {
      toast.error('Failed to save alert');
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      coinId: alert.coinId,
      coinName: alert.coinName,
      symbol: alert.symbol,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
      isActive: alert.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this alert?')) {
      try {
        await alertsAPI.delete(id);
        toast.success('Alert deleted');
        fetchAlerts();
      } catch {
        toast.error('Failed to delete alert');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white">Price Alerts</h1>
            <p className="text-gray-400">Get notified when crypto prices move</p>
          </div>

          <button
            onClick={() => {
              setEditingAlert(null);
              setFormData({
                coinId: '',
                coinName: '',
                symbol: '',
                targetPrice: '',
                condition: 'above',
                isActive: true,
              });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <FaPlus /> <span>Create Alert</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {alerts.length === 0 ? (
              <div className="col-span-full bg-gray-800 text-gray-300 rounded-lg shadow-md p-10 text-center">
                <FaBell className="mx-auto text-5xl text-gray-500 mb-4" />
                <p>No alerts found. Create your first alert!</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-gray-800 rounded-lg shadow-md p-6 border-l-4 
                    ${
                      alert.isActive
                        ? 'border-blue-500'
                        : 'border-gray-600 opacity-70'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {alert.coinName}
                      </h3>
                      <p className="text-gray-400 text-sm">{alert.symbol}</p>
                    </div>

                    <span
                      className={`px-2 py-1 text-xs rounded-full 
                        ${
                          alert.isActive
                            ? 'bg-green-700/30 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                    >
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm">Target Price</p>
                  <p className="text-lg text-white font-semibold mb-3">
                    ${alert.targetPrice.toFixed(2)}
                  </p>

                  <p className="text-gray-400 text-sm">Condition</p>
                  <p className="text-gray-200 mb-4">
                    Price goes {alert.condition} ${alert.targetPrice}
                  </p>

                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleEdit(alert)}
                      className="px-3 py-2 text-blue-400 hover:text-blue-300"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="px-3 py-2 text-red-400 hover:text-red-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md text-gray-200 shadow-xl">

            <h2 className="text-2xl font-bold text-blue-400 mb-4">
              {editingAlert ? 'Edit Alert' : 'Create Alert'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Crypto Dropdown */}
              <div>
                <label className="text-gray-300 text-sm">Cryptocurrency</label>
                <select
                  value={formData.coinId}
                  onChange={(e) =>
                    setFormData({ ...formData, coinId: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  <option value="">Select coin</option>
                  {cryptoList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Price */}
              <div>
                <label className="text-gray-300 text-sm">Target Price (USD)</label>
                <input
                  type="number"
                  value={formData.targetPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, targetPrice: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="text-gray-300 text-sm">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <span>Active</span>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                >
                  {editingAlert ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 p-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
