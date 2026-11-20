import React, { useState } from 'react';
import { Star, Lock, Mail } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin } = useAdmin();
  const [email, setEmail] = useState('ananya.rao@varchlearn.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
    } catch (err: any) {
      setError(err?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EEFC] via-white to-[#E6D9FA] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#E2D6F8] shadow-xl space-y-5"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#7041C6] flex items-center justify-center shadow">
            <Star className="w-7 h-7 text-[#FFB800] fill-[#FFB800]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#39245F]">VarchLearn Admin</h1>
          <p className="text-xs text-[#64587A]">Sign in to manage classes, assessments & AI content</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#7041C6]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E2D6F8] text-sm"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#7041C6]" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E2D6F8] text-sm"
            />
          </div>
        </div>

        {error ? <p className="text-xs font-bold text-rose-600 text-center">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] py-3 rounded-xl bg-[#7041C6] text-white font-bold text-sm hover:bg-[#532B9E] disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
        </button>

        <p className="text-[11px] text-center text-[#8F84A6]">
          Seeded Admin: ananya.rao@varchlearn.edu / admin123
        </p>
      </form>
    </div>
  );
};
