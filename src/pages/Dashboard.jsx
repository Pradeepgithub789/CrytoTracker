import { useState, useEffect } from 'react';
import { cryptoAPI } from '../services/api';
import CryptoCard from '../components/CryptoCard';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [allCryptos, setAllCryptos] = useState([]);
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchAllCryptos();
    const interval = setInterval(fetchAllCryptos, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!allCryptos.length) {
      setCryptos([]);
      return;
    }
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCryptos(allCryptos.slice(startIndex, endIndex));
  }, [page, allCryptos]);

  const fetchAllCryptos = async () => {
    try {
      setLoading(true);
      const allData = await cryptoAPI.getAllCryptocurrencies();

      if (allData && allData.length > 0) {
        setAllCryptos(allData);
      } else {
        toast.error('Failed to load cryptocurrency data.');
      }
    } catch (error) {
      toast.error('Failed to fetch crypto data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = cryptos.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(allCryptos.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Crypto Market Dashboard
          </h1>
          <p className="text-gray-300">
            Real-time cryptocurrency prices and market data
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
                         text-gray-200 placeholder-gray-400 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <>
            {/* FULL-WIDTH HORIZONTAL LIST */}
            <div className="flex flex-col space-y-4">
              {filteredCryptos.map((crypto) => (
                <CryptoCard key={crypto.id} crypto={crypto} />
              ))}
            </div>

            {filteredCryptos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No cryptocurrencies found.
                </p>
              </div>
            )}

            {/* Pagination */}
            {!searchTerm && allCryptos.length > itemsPerPage && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                             disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-300">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                             disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
