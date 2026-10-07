import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { getTokenExpiration } from '../utils/auth';

export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

const AuthSessionGuard = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const expiresAt = userInfo ? getTokenExpiration(userInfo.token) : null;
  const isExpired = Boolean(userInfo && (!expiresAt || expiresAt <= Date.now()));

  useEffect(() => {
    if (!userInfo) {
      return undefined;
    }

    const endSession = () => {
      dispatch(logout());
      navigate('/login', { replace: true });
    };

    if (isExpired) {
      endSession();
      return undefined;
    }

    const timeout = window.setTimeout(endSession, expiresAt - Date.now());
    const handleSessionExpired = () => endSession();
    const handleStorageChange = (event) => {
      if (event.key === 'userInfo' && event.newValue === null) {
        endSession();
      }
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch, expiresAt, isExpired, navigate, userInfo]);

  if (isExpired) {
    return null;
  }

  return children;
};

export default AuthSessionGuard;
