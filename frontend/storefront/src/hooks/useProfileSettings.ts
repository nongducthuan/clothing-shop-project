import { useState } from "react";
import { AuthContext } from "@shop/shared/context/AuthContext";
import API from "@shop/shared/services/apiClient";
import { useToast } from "@shop/shared/context/ToastContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { extractApiErrorMessage, type ApiErrorPayload } from "@shop/shared/utils/apiErrorUtils";
import { useRequiredContext } from "@shop/shared/hooks/useRequiredContext";

/** Cập nhật số điện thoại và đổi mật khẩu trên trang profile. */
export function useProfileSettings() {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();
  const { user, refreshUser } = useRequiredContext(AuthContext, 'AuthContext');

  const [phone, setPhone] = useState(user?.phone || "");

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/auth/profile",
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(t("profile.profile_updated"), "success");
      refreshUser();
    } catch (error) {
      console.error("Update profile error:", error);
      const axiosErr = error as { response?: { data?: ApiErrorPayload } };
      showToast(
        `${t("profile.update_failed")} ${extractApiErrorMessage(
          axiosErr.response?.data,
          translateApiMessage
        )}`.trim(),
        "error"
      );
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t("profile.fill_password"), "warning");
      return;
    }
    if (newPassword.length < 8) {
      showToast(t("profile.password_too_short"), "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t("profile.password_mismatch"), "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.put(
        "/auth/password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // The server revokes all sessions on password change and returns a fresh pair
      // for this device; without storing it we'd be logged out when the old token expires.
      if (res.data?.token && res.data?.refreshToken) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
      }
      showToast(t("profile.password_changed"), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      const axiosErr = error as { response?: { data?: ApiErrorPayload } };
      showToast(
        extractApiErrorMessage(
          axiosErr.response?.data,
          translateApiMessage,
          t("profile.password_failed")
        ),
        "error"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    phone, setPhone, updateProfile,
    currentPassword, newPassword, confirmPassword, isChangingPassword,
    setCurrentPassword, setNewPassword, setConfirmPassword, changePassword,
  };
}
