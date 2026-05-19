import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient.js";
import { AuthContext } from "../../context/AuthContext.jsx";

export function useLogin() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

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
      // Authenticate with the backend API
      const res = await API.post("/auth/login", form);
      const { user, token } = res.data;

      // Ensure necessary data is present in the response
      if (!user || !token) {
        setError("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      // Persist session to local storage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Update global context
      setUser(user);

      // Role-based redirection
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
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
