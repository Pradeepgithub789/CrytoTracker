import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaEnvelope, FaSpinner } from 'react-icons/fa';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          toast.error("Please fill in all fields");
          return;
        }

        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success("Login successful!");
          navigate("/");
        } else {
          toast.error(result.error || "Login failed");
        }
      } else {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
          toast.error("Please fill in all fields");
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }

        const result = await signup(formData.name, formData.email, formData.password);
        if (result.success) {
          toast.success("Account created!");
          navigate("/");
        } else {
          toast.error(result.error || "Signup failed");
        }
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">

      {/* Glowing Crypto Background Icons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 text-7xl text-blue-500 animate-pulse">₿</div>
        <div className="absolute bottom-32 right-16 text-6xl text-purple-500 animate-bounce">Ξ</div>
        <div className="absolute top-1/2 left-1/3 text-5xl text-blue-400 animate-pulse">●</div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-10">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Crypto Tracker
            </h1>
            <p className="text-gray-400 mt-2">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {!isLogin && (
              <div>
                <label className="block text-gray-300 mb-1">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg pl-10 p-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg pl-10 p-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg pl-10 p-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-gray-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm password"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg pl-10 p-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? "Login" : "Sign Up"}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
