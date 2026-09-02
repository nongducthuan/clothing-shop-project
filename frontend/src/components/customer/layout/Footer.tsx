import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

export default function Footer() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Hide footer on admin pages and auth pages
  if (location.pathname.startsWith("/admin") || location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <footer className="bg-[#020617] text-slate-300 pt-16 pb-8 border-t border-slate-800/60 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Dùng items-start để tất cả tiêu đề cột luôn bắt đầu từ cùng 1 độ cao */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80 items-start">
          
          {/* Cột 1: Brand Info */}
          <div className="flex flex-col items-start space-y-5">
            <div className="border-b-2 border-white pb-1">
              <Link to="/" className="font-black text-2xl text-white tracking-tighter no-underline inline-block">
                CLOTHING<span className="text-violet-500">SHOP</span>
              </Link>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed text-left m-0">
              Experience premium fashion with modern, sophisticated design and minimalist style. 
              Your quality and satisfaction are our top priority.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {['facebook-f', 'instagram', 'tiktok', 'youtube'].map((icon) => (
                <a key={icon} href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500 transition-all">
                  <i className={`fa-brands fa-${icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Cột 2: Explore - Đã sửa lỗi lệch lề */}
          <div className="flex flex-col items-start">
            <h4 className="text-white font-bold text-sm mb-6 tracking-widest uppercase">Explore</h4>
            <ul className="flex flex-col items-start space-y-3.5 text-sm p-0 m-0 list-none text-left w-full">
              <li><Link to="/" className="text-slate-400 hover:text-violet-400 transition-colors no-underline">Home</Link></li>
              <li><Link to="/sales-policy" className="text-slate-400 hover:text-violet-400 transition-colors no-underline text-nowrap">Sales Policy</Link></li>
              <li>
                {user ? (
                  <Link to="/profile?tab=orders" className="text-slate-400 hover:text-violet-400 transition-colors no-underline text-nowrap">My Orders</Link>
                ) : (
                  <Link to="/order" className="text-slate-400 hover:text-violet-400 transition-colors no-underline text-nowrap">Order Tracking</Link>
                )}
              </li>
              <li><Link to="/search" className="text-slate-400 hover:text-violet-400 transition-colors no-underline text-nowrap">Search Products</Link></li>
            </ul>
          </div>

          {/* Cột 3: Customer Care */}
          <div className="flex flex-col items-start">
            <h4 className="text-white font-bold text-sm mb-6 tracking-widest uppercase">Customer Care</h4>
            <ul className="flex flex-col items-start space-y-3.5 text-sm text-slate-400 p-0 m-0 list-none w-full">
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-truck-fast text-violet-500 w-5 text-left"></i>
                <span className="text-nowrap">Nationwide Shipping</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-arrow-rotate-left text-violet-500 w-5 text-left"></i>
                <span className="text-nowrap">Easy 7-Day Returns</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-shield-halved text-violet-500 w-5 text-left"></i>
                <span className="text-nowrap">Quality Product Warranty</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-headset text-violet-500 w-5 text-left"></i>
                <span className="text-nowrap">24/7 Advisory Support</span>
              </li>
            </ul>
          </div>

          {/* Cột 4: Contact Us - Sửa lỗi rớt dòng email */}
          <div className="flex flex-col items-start">
            <h4 className="text-white font-bold text-sm mb-6 tracking-widest uppercase">Contact Us</h4>
            <ul className="flex flex-col items-start space-y-4 text-sm text-slate-400 p-0 m-0 list-none w-full">
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-phone text-violet-500 mt-1 w-5 flex-shrink-0"></i>
                <span className="text-left">Hotline: <a href="tel:0123456789" className="text-white font-semibold hover:text-violet-400 no-underline transition-colors">0123-456-789</a></span>
              </li>
              <li className="flex items-start gap-3 w-full">
                <i className="fa-solid fa-envelope text-violet-500 mt-1 w-5 flex-shrink-0"></i>
                <div className="flex flex-col items-start">
                   <span className="text-left">Email:</span>
                   <a href="mailto:support@shopquanao.com" className="text-slate-400 hover:text-violet-400 no-underline transition-colors break-all">support@shopquanao.com</a>
                </div>
              </li>
              <li className="flex items-start gap-3 w-full">
                <i className="fa-solid fa-location-dot text-violet-500 mt-1 w-5 flex-shrink-0"></i>
                <a href="#" className="text-slate-400 hover:text-violet-400 no-underline transition-colors text-left leading-relaxed">
                  Nam Ky Khoi Nghia, Binh Duong, HCMC
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Clothing Shop. All Rights Reserved.</p>
          <div className="flex items-center gap-5 text-slate-500 text-lg">
            <i className="fa-brands fa-cc-visa hover:text-white transition-colors cursor-pointer"></i>
            <i className="fa-brands fa-cc-mastercard hover:text-white transition-colors cursor-pointer"></i>
            <i className="fa-brands fa-cc-paypal hover:text-white transition-colors cursor-pointer"></i>
            <i className="fa-solid fa-wallet hover:text-white transition-colors cursor-pointer"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}