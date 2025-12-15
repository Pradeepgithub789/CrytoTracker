import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const CryptoCard = ({ crypto, onClick }) => {
  const isPositive = crypto.price_change_percentage_24h >= 0;

  return (
    <div
      onClick={onClick}
      className="crypto-card w-full flex items-center justify-between 
                 bg-gray-800 rounded-lg shadow-md p-4 
                 transition-all cursor-pointer border border-gray-700 
                 hover:bg-gray-700 hover:shadow-xl"
    >
      {/* LEFT: ICON + NAME */}
      <div className="flex items-center space-x-4">
        <img
          src={crypto.image}
          alt={crypto.name}
          className="w-12 h-12 rounded-full"
        />

        <div>
          <h3 className="font-bold text-xl text-white">{crypto.name}</h3>
          <p className="text-sm text-gray-400 uppercase">{crypto.symbol}</p>
        </div>
      </div>

      {/* RIGHT: PRICE + CHANGE + MARKET CAP */}
      <div className="flex flex-col items-end space-y-1">
        <p className="text-xl font-bold text-gray-100">
          ${crypto.current_price?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <div className="flex items-center space-x-2">
          {isPositive ? (
            <FaArrowUp className="text-green-400" />
          ) : (
            <FaArrowDown className="text-red-400" />
          )}

          <span
            className={`font-semibold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {Math.abs(crypto.price_change_percentage_24h)?.toFixed(2)}%
          </span>
        </div>

        <p className="text-sm text-gray-400">
          Market Cap: ${crypto.market_cap?.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default CryptoCard;
