import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient.ts";
import { AuthContext } from "../../context/AuthContext.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";

export function useLogin() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { t } = useLanguage();

  /**
   * Synchronizes local form state with input changes.
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Manages the authentication process: validates credentials,
   * persists session data, and redirects the user based on their role.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      const { user, token, refreshToken } = res.data;

      if (!user || !token || !refreshToken) {
        setError(t("auth.invalid_response"));
        setIsLoading(false);
        return;
      }

      login(user, token, refreshToken);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || t("auth.login_failed");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: { form, error, isLoading },
    actions: { handleChange, handleSubmit }
  };
}
