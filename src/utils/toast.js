export function showToast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('tg-toast', { detail: { message, type } }));
}
