import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-8 border-t border-slate-800/60 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="font-black text-2xl text-white tracking-tighter inline-block">
              CLOTHING<span className="text-violet-500">SHOP</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Trải nghiệm thời trang cao cấp với thiết kế hiện đại, tinh tế và phong cách tối giản. Chất lượng và sự hài lòng của bạn là ưu tiên hàng đầu của chúng tôi.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500 transition-all">
                <i className="fa-brands fa-facebook-f text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500 transition-all">
                <i className="fa-brands fa-instagram text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500 transition-all">
                <i className="fa-brands fa-tiktok text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500 transition-all">
                <i className="fa-brands fa-youtube text-sm"></i>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4 tracking-wide uppercase">Khám Phá</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-violet-400 transition-colors">Trang chủ</Link>
              </li>
              <li>
                <Link to="/sales-policy" className="hover:text-violet-400 transition-colors">Chính sách bán hàng</Link>
              </li>
              <li>
                <Link to="/order" className="hover:text-violet-400 transition-colors">Tra cứu đơn hàng</Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-violet-400 transition-colors">Tìm kiếm sản phẩm</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Policies */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4 tracking-wide uppercase">Chăm Sóc Khách Hàng</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-truck-fast text-violet-500 text-xs"></i>
                <span>Giao hàng toàn quốc</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-arrow-rotate-left text-violet-500 text-xs"></i>
                <span>Đổi trả dễ dàng trong 7 ngày</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-violet-500 text-xs"></i>
                <span>Bảo hành chất lượng sản phẩm</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-headset text-violet-500 text-xs"></i>
                <span>Hỗ trợ tư vấn 24/7</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4 tracking-wide uppercase">Liên Hệ</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-phone text-violet-500 mt-1"></i>
                <span>Hotline: <a href="tel:0123456789" className="hover:text-violet-400 transition-colors text-white font-medium">0123-456-789</a></span>
              </li>
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-envelope text-violet-500 mt-1"></i>
                <span>Email: <a href="mailto:support@shopquanao.com" className="hover:text-violet-400 transition-colors">support@shopquanao.com</a></span>
              </li>
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-location-dot text-violet-500 mt-1"></i>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Đường+Nam+Kỳ+Khởi+Nghĩa,+Phường+Hòa+Phú,+Thủ+Dầu+Một,+Bình+Dương,+Việt+Nam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-400 transition-colors"
                >
                  Nam Kỳ Khởi Nghĩa, Bình Dương, TP. Hồ Chí Minh
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & payment methods */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Clothing Shop. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 text-base">
            <i className="fa-brands fa-cc-visa hover:text-white transition-colors" title="Visa"></i>
            <i className="fa-brands fa-cc-mastercard hover:text-white transition-colors" title="Mastercard"></i>
            <i className="fa-brands fa-cc-paypal hover:text-white transition-colors" title="Paypal"></i>
            <i className="fa-solid fa-wallet hover:text-white transition-colors" title="COD / Digital Wallet"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}
