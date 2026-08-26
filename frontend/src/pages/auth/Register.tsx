import React from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../../hooks/auth/useRegister";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";

export default function Register() {
  const { state, actions } = useRegister();
  const { form, error, success, isLoading } = state;
  const { handleChange, handleSubmit } = actions;

  return (
    <div className="flex-1 bg-slate-50 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-md">

        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight mb-3">
            Create an account
          </h2>
          <p className="text-slate-500">
            Join us to get the best shopping experience.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white py-10 px-8 rounded-[2.5rem] shadow-sm border border-slate-100">

          <AuthAlert type="error" message={error} />
          <AuthAlert type="success" message={success} />

          <form onSubmit={handleSubmit} className="space-y-2">
            <AuthInput
              label="Full Name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />

            <AuthInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <AuthInput
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="0901234567"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <AuthInput
              label="Password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />

            <AuthInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Match your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full py-4 bg-slate-900 text-white rounded-full font-medium text-base hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? "Processing..." : "Sign Up"}
              </button>
            </div>
          </form>

          {/* Footer Section */}
          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">Already have an account? </span>
            <Link to="/login" className="font-medium text-slate-900 hover:underline underline-offset-4 transition-colors">
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

