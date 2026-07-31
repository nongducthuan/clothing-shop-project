import React from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks/auth/useLogin";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";

export default function Login() {
  const { state, actions } = useLogin();
  const { form, error, isLoading } = state;
  const { handleChange, handleSubmit } = actions;

  return (
    <div className="flex-1 bg-slate-50 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-md">

        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight mb-3">
            Welcome back
          </h2>
          <p className="text-slate-500">
            Please enter your details to sign in.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white py-10 px-8 rounded-[2.5rem] shadow-sm border border-slate-100">

          <AuthAlert type="error" message={error} />

          <form onSubmit={handleSubmit} className="space-y-2">
            <AuthInput
              label="Email Address"
              name="identifier"
              type="email"
              placeholder="name@example.com"
              value={form.identifier}
              onChange={handleChange}
              required
            />

            <AuthInput
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-full font-medium text-base hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          {/* Footer Section */}
          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">Don't have an account? </span>
            <Link to="/register" className="font-medium text-slate-900 hover:underline underline-offset-4 transition-colors">
              Sign up
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
