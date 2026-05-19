import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 mt-12 py-8 text-center text-white">
      <p className="mb-1">
        📞 Hotline: <a href="tel:0123456789" className="text-white underline">0123-456-789</a>
      </p>
      <p className="mb-1">
        📧 Email: <a href="mailto:support@shopquanao.com" className="text-white underline">support@shopquanao.com</a>
      </p>
      <p className="mb-1">
        🏠 Address:{" "}
        <a
          href="https://www.google.com/maps/search/?api=1&query=Đường+Nam+Kỳ+Khởi+Nghĩa,+Phường+Hòa+Phú,+Thủ+Dầu+Một,+Bình+Dương,+Việt+Nam"
          className="text-white underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nam Ky Khoi Nghia St, Binh Duong Ward, Ho Chi Minh City
        </a>
      </p>
      <p className="mb-0">
        © {new Date().getFullYear()} Clothing Shop - All Rights Reserved
      </p>
    </footer>
  );
}
