import { useState } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";

type AxiosErr = { response?: { data?: { message?: string } } };

export function useOrderLookup() {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnForm, setReturnForm] = useState<{
    reason_code: string;
    description: string;
    bank_name: string;
    bank_acc: string;
    bank_owner: string;
    images?: File[];
  }>({
    reason_code: "",
    description: "",
    bank_name: "",
    bank_acc: "",
    bank_owner: ""
  });

  /**
   * Expands or collapses the item details for a specific order.
   */
  const toggleOrder = (orderId: number | string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  /**
   * Triggers the OTP sending process to the user's email.
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/orders/send-otp", { email });
      setStep(2);
    } catch (err: unknown) {
      showToast("Error sending OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifies the OTP and retrieves the list of orders if valid.
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/orders/verify-otp", { email, code: otp });
      setOrders(res.data.orders);
      setStep(3);
    } catch (err: unknown) {
      showToast("Incorrect or expired OTP code", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates repayment for pending MoMo orders.
   */
  const handleRepay = async (order: { id: number | string }) => {
    setLoading(true);
    try {
      const res = await API.post(`/orders/${order.id}/repay`, { email });
      if (res.data.payUrl) {
        window.location.href = res.data.payUrl;
      }
    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      showToast(axErr.response?.data?.message || "Error initiating payment", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the return form for a specific order.
   */
  const openReturnForm = (order: { id: number | string }) => {
    setSelectedOrder(order);
    setStep(4);
  };

  /**
   * Submits the return request with attached images and bank info.
   */
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create an empty FormData object
      const formData = new FormData();

      // 2. Append text data fields
      formData.append("reason_code", returnForm.reason_code);
      formData.append("description", returnForm.description);
      formData.append("email", email); // Required to authenticate Guest

      // 3. Package bank info into JSON string and append
      const refund_bank_info = {
        name: returnForm.bank_name,
        acc: returnForm.bank_acc,
        owner: returnForm.bank_owner
      };
      formData.append("refund_bank_info", JSON.stringify(refund_bank_info));

      // 4. IMPORTANT: Iterate through images array and append each file to FormData
      // Note: "images" key must match the backend upload configuration (Multer)
      if (returnForm.images && returnForm.images.length > 0) {
        returnForm.images.forEach((file) => {
          formData.append("images", file);
        });
      }

      // 5. Send API request with FormData
      // Must add "multipart/form-data" header for file uploads
      await API.put(`/orders/${selectedOrder.id}/return-request`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 6. Update UI (Hide the Return button)
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              status: 'Return Requested', // Change status to hide button
              return_id: 'pending_guest_req' // Assign dummy ID to show processing message
            };
          }
          return order;
        })
      );

      // 7. Reset form and show success message
      showToast("Return request submitted successfully!", "success");
      setStep(3); // Return to order list
      setSelectedOrder(null);
      setReturnForm({
        reason_code: "",
        description: "",
        bank_name: "",
        bank_acc: "",
        bank_owner: "",
        images: [] // Reset image array
      });

    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      console.error("Error submitting return request:", err);
      showToast(axErr.response?.data?.message || "Error submitting return request", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats a number into Vietnamese Dong currency format.
   */
  const formatCurrency = (val: number | string) => Number(val).toLocaleString("vi-VN") + "đ";

  // Reset function to go back to the very beginning
  const resetLookup = () => {
    setStep(1);
    setOrders([]);
    setOtp("");
    setEmail("");
  };

  return {
    state: {
      step, email, otp, orders, loading, expandedOrder, selectedOrder, returnForm
    },
    actions: {
      setStep, setEmail, setOtp, setReturnForm,
      toggleOrder, handleSendOtp, handleVerifyOtp, handleRepay, openReturnForm, handleReturnSubmit, resetLookup
    },
    helpers: {
      formatCurrency
    }
  };
}

