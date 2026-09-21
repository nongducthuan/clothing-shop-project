import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function useLogin() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
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
      const { user, token } = res.data;

      if (!user || !token) {
        setError(t("auth.invalid_response"));
        setIsLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      setUser(user);

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
