import React from "react";

export function ShippingSection({ address, setAddress, fetchLocation, isLocating, locationError }) {
  return (
    <section className="mb-10">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl font-medium text-slate-900">Shipping Address</h3>
        <button
          onClick={() => fetchLocation(setAddress)}
          disabled={isLocating}
          className="text-xs bg-transparent font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <i className={`fa-solid ${isLocating ? "fa-spinner animate-spin" : "fa-location-crosshairs"}`}></i>
          {isLocating ? "Locating..." : "Use Current Location"}
        </button>
      </div>
      <textarea
        rows={3}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter your house number, street, ward, district..."
        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all resize-none text-slate-900 placeholder:text-slate-400 text-sm"
      />
      {locationError && <p className="text-rose-500 text-xs mt-2 ml-1">{locationError}</p>}
    </section>
  );
}

export function GuestContactSection({ guestInfo, onChange }) {
  return (
    <section className="mb-10">
      <h3 className="text-xl font-medium text-slate-900 mb-4">Contact Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Full Name" name="name" value={guestInfo.name} onChange={onChange} placeholder="John Doe" />
        <InputField label="Phone Number" name="phone" value={guestInfo.phone} onChange={onChange} placeholder="0901234567" />
        <div className="md:col-span-2">
          <InputField label="Email Address" type="email" name="email" value={guestInfo.email} onChange={onChange} placeholder="john@example.com" />
        </div>
      </div>
    </section>
  );
}

export function PaymentSection({ currentMethod, onChange }) {
  return (
    <section className="mb-10">
      <h3 className="text-xl font-medium text-slate-900 mb-4">Payment Method</h3>
      <div className="space-y-3">
        <PaymentOption
          id="cod" label="Cash on Delivery" sub="Pay when you receive the package"
          icon="fa-box" current={currentMethod} onChange={onChange}
        />
        <PaymentOption
          id="momo" label="MoMo E-Wallet" sub="Fast & Secure online payment"
          icon="fa-wallet" current={currentMethod} onChange={onChange}
        />
      </div>
    </section>
  );
}

// --- Internal Reusable Sub-components ---
const InputField = ({ label, type = "text", ...props }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <input
      {...props}
      type={type}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm"
    />
  </div>
);

const PaymentOption = ({ id, label, sub, icon, current, onChange }) => {
  const isSelected = current === id;
  return (
    <label onClick={() => onChange(id)} className={`flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition-all duration-300 ${isSelected ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white hover:border-slate-400"}`}>
      <div className="flex items-center gap-4">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-white" : "border-slate-300"}`}>
          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
        </div>
        <div>
          <span className={`block font-medium ${isSelected ? "text-white" : "text-slate-900"}`}>{label}</span>
          <p className={`text-xs mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{sub}</p>
        </div>
      </div>
      <i className={`fa-solid ${icon} text-xl opacity-80`}></i>
    </label>
  );
};

