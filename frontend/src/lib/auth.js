const TOKEN_KEY = "an_auth_token";
const USER_KEY = "an_user_info";

// Cookie Helpers
export function setCookie(name, value, days = 7) {
  try {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${encodeURIComponent(value || "")}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn("Cookie write unavailable:", e);
  }
}

export function getCookie(name) {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  } catch (e) {
    console.warn("Cookie read unavailable:", e);
  }
  return null;
}

export function deleteCookie(name) {
  try {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  } catch (e) {
    console.warn("Cookie delete unavailable:", e);
  }
}

export function setAuthToken(token, user, remember = true) {
  const userJson = JSON.stringify(user);

  // 1. Always store in active Session Storage
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, userJson);

  // 2. Store in Cookies (session or 7-day persistent)
  setCookie(TOKEN_KEY, token, remember ? 7 : null);
  setCookie(USER_KEY, userJson, remember ? 7 : null);

  // 3. Store in Local Storage if remember requested
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userJson);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getAuthToken() {
  return (
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    getCookie(TOKEN_KEY)
  );
}

export function getCurrentUser() {
  const raw =
    sessionStorage.getItem(USER_KEY) ||
    localStorage.getItem(USER_KEY) ||
    getCookie(USER_KEY);

  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

export function getUserRole() {
  const user = getCurrentUser();
  return user?.role || "CITIZEN";
}

