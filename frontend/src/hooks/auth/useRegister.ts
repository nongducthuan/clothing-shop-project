import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient.js";

export function useRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  /** * Synchronizes input field values with the local state object
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** * Validates input data and submits the registration request to the API
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic Validation
    if (form.password !== form.confirmPassword) {
      setError("Confirmation password does not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const { name, email, phone, password } = form;
      await API.post("/auth/register", { name, email, phone, password });

      setSuccess("Registration successful! Redirecting to login...");

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr.response?.data?.message || "Registration failed. Please try again later.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: { form, error, success, isLoading },
    actions: { handleChange, handleSubmit }
  };
}
