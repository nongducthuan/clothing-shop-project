import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import API from '../../services/apiClient';
import { useLanguage } from '../../context/LanguageContext';

interface NotificationItem {
  id: number;
  title?: string;
  title_en?: string;
  message?: string;
  message_en?: string;
  is_read?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export default function NotificationDropdown({ isAdmin = false }) {
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

    const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId: number | undefined = user?.id;

  useEffect(() => {
        API.get('/notifications')
      .then(res => {
        if (res.data?.success) {
          const list: NotificationItem[] = res.data.data || [];
          setNotifications(list);
          setUnreadCount(list.filter((notif) => !notif.is_read).length);
        }
      })
      .catch(err => console.error('Failed to fetch notifications', err));

        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
    });

    if (isAdmin) {
      socket.emit('join_admin_room');
    } else if (userId) {
      socket.emit('join_user_room');
    }

    const handleNewNotification = (data: { notification?: NotificationItem }) => {
      const notification = data.notification;
      if (notification) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

            const events = ['new_order', 'order_cancelled', 'payment_success', 'new_return_request', 'return_cancelled', 'customer_notification'];
    events.forEach(evt => socket.on(evt, handleNewNotification));

    return () => {
      socket.disconnect();
    };
  }, [isAdmin, userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
      >
        <i className="fa-regular fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`
          bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden flex flex-col max-h-[80vh]
          ${isAdmin
            ? "absolute right-0 mt-3 w-80 sm:w-96"
            : "fixed top-[72px] right-4 left-4 sm:left-auto sm:absolute sm:top-auto sm:right-0 sm:mt-3 sm:w-80 md:w-96"
          }
        `}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t("nav.notifications", "Thông báo")}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {t("nav.mark_all_read", "Đánh dấu đã đọc tất cả")}
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar max-h-96">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fa-regular fa-bell-slash text-2xl"></i>
                </div>
                <p>{t("nav.no_notifications", "Bạn chưa có thông báo nào")}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => { if(!notif.is_read) markAsRead(notif.id); }}
                    className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>}
                      <div>
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                          {language === 'en' && notif.title_en ? notif.title_en : notif.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{language === 'en' && notif.message_en ? notif.message_en : notif.message}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          {notif.created_at ? new Date(notif.created_at).toLocaleString('vi-VN') : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
