export const getStoredUserInfo = () => {
  const storedUserInfo = localStorage.getItem('userInfo');
  if (!storedUserInfo) {
    return null;
  }

  try {
    return JSON.parse(storedUserInfo);
  } catch (error) {
    console.error('Unable to read the stored user session:', error);
    localStorage.removeItem('userInfo');
    return null;
  }
};

export const getTokenExpiration = (token) => {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const expiration = JSON.parse(decodedPayload).exp;
    return typeof expiration === 'number' ? expiration * 1000 : null;
  } catch (error) {
    console.warn('Unable to read the authentication token expiration:', error);
    return null;
  }
};
