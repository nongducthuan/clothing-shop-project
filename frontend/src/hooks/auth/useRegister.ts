import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient.ts";
import { useLanguage } from "../../context/LanguageContext.tsx";

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
  const { t } = useLanguage();

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

    if (form.password !== form.confirmPassword) {
      setError(t("auth.password_mismatch"));
      return;
    }

    if (form.password.length < 6) {
      setError(t("auth.password_too_short"));
      return;
    }

    setIsLoading(true);

    try {
      const { name, email, phone, password } = form;
      await API.post("/auth/register", { name, email, phone, password });

      setSuccess(t("auth.register_success"));

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr.response?.data?.message || t("auth.register_failed");
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
