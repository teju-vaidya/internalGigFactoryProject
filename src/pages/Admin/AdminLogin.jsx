import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import gigfactoryLogo from '../../assets/logo.png';

const AdminLogin = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const navigate                = useNavigate();
  const setAuth                 = useAuthStore((state) => state.setAuth);
  const token                   = useAuthStore((state) => state.token);
  const user                    = useAuthStore((state) => state.user);

  const [geoInfo, setGeoInfo] = useState({ ip: '', location: '' });

  useEffect(() => {
    const fetchGeo = async () => {
      // 1. IP-based lookup using ipapi.co
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('API response error');
        const data = await res.json();
        let city = data.city || '';
        if (city.toLowerCase() === 'nanded') {
          city = 'Nagpur';
        }
        const locStr = [city, data.region, data.country_name].filter(Boolean).join(', ');
        setGeoInfo({
          ip: data.ip || '',
          location: locStr || ''
        });
      } catch (err) {
        // 2. Fallback to ipwho.is if ipapi.co fails
        try {
          const res2 = await fetch('https://ipwho.is/');
          const data2 = await res2.json();
          if (data2 && data2.success) {
            let city2 = data2.city || '';
            if (city2.toLowerCase() === 'nanded') {
              city2 = 'Nagpur';
            }
            const locStr2 = [city2, data2.region, data2.country].filter(Boolean).join(', ');
            setGeoInfo({
              ip: data2.ip || '',
              location: locStr2 || ''
            });
          }
        } catch (err2) {
          console.warn('All GeoIP services failed:', err2);
        }
      }
    };
    fetchGeo();
  }, []);

  useEffect(() => {
    if (token && user && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [token, user, navigate]);

  const [loginParams, setLoginParams] = useState(null);
  const loginQuery = useQuery({
    queryKey: ['admin-login', loginParams],
    queryFn: () => api.post('/auth/login', { 
      email: loginParams.email, 
      password: loginParams.password,
      clientIp: geoInfo.ip,
      clientLocation: geoInfo.location
    }),
    enabled: !!loginParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (loginQuery.data) {
      const data = loginQuery.data;
      if (data.user?.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.');
        setLoginParams(null);
        return;
      }
      setAuth(data.token, data.refreshToken, data.user);
      toast.success('Welcome, Admin!');
      navigate('/admin/dashboard');
      setLoginParams(null);
    }
  }, [loginQuery.data, navigate, setAuth]);

  useEffect(() => {
    if (loginQuery.error) {
      toast.error(loginQuery.error.message || 'Login failed. Check your credentials.');
      setLoginParams(null);
    }
  }, [loginQuery.error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter email and password.');
      return;
    }
    setLoginParams({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-5">
      <div className="w-full max-w-[400px] bg-[#181818] border border-[#2c2c2c] rounded-[10px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        {/* top accent */}
        <div className="h-[3px] bg-[#70d64d]" />

        <div className="py-9 px-7 text-center">
          {/* logo */}
          <img src={gigfactoryLogo} alt="GigFactory" className="w-[160px] max-w-full object-contain mb-5" />

          {/* heading */}
          <div className="inline-flex items-center justify-center w-11 h-11 bg-[#70d64d]/10 border border-[#70d64d]/25 rounded-full mb-3">
            <ShieldCheck size={20} color="#70d64d" />
          </div>
          <h1 className="text-white text-2xl font-extrabold tracking-[0.5px] m-0">ADMIN PORTAL</h1>
          <p className="text-[#8a8a8a] text-[0.72rem] tracking-[2px] font-semibold mt-1 mb-0">SUPERADMIN ACCESS ONLY</p>

          <hr className="border-none h-[2px] bg-[#70d64d] my-6" />

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#8a8a8a] text-[0.78rem] font-medium" htmlFor="admin-email">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-[#52525b] pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@gigfactory.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-md text-white text-[0.88rem] py-[11px] pr-3 pl-[42px] outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#8a8a8a] text-[0.78rem] font-medium" htmlFor="admin-password">Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-[#52525b] pointer-events-none" />
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-md text-white text-[0.88rem] py-[11px] pr-3 pl-[42px] outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#70d64d] text-black border-none rounded-md py-3 text-[0.95rem] font-extrabold flex items-center justify-center gap-2 mt-1 transition-opacity"
              style={{
                opacity: loginQuery.isFetching ? 0.7 : 1,
                cursor: loginQuery.isFetching ? 'not-allowed' : 'pointer',
              }}
              disabled={loginQuery.isFetching}
            >
              {loginQuery.isFetching ? 'Authenticating…' : 'Login to Admin Panel'}
              {!loginQuery.isFetching && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-[0.82rem]">
            <a href="/" className="text-[#8a8a8a] no-underline">← Back to main site</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
