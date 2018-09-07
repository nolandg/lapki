
export const deleteAuthCookie = () => {
  document.cookie = 'lapki_auth_token_insecure=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
