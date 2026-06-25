export function saveAuth(token: string, user: unknown) {
  if (typeof window === "undefined") return;

  localStorage.setItem("servepass_token", token);
  localStorage.setItem("servepass_user", JSON.stringify(user));
}

export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("servepass_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("servepass_user");

  return user ? JSON.parse(user) : null;
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("servepass_token");
  localStorage.removeItem("servepass_user");

  window.location.href = "/login";
}