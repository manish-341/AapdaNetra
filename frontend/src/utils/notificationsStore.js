// AapdaNetra Notification & Alert Read-State Store

const READ_ALERT_IDS_KEY = 'aapdanetra_read_alert_ids';
const LAST_READ_TIME_KEY = 'aapdanetra_notifications_last_read_time';

export function getReadAlertIds() {
  try {
    const data = localStorage.getItem(READ_ALERT_IDS_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

export function getLastReadTimestamp() {
  try {
    const val = localStorage.getItem(LAST_READ_TIME_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function isAlertRead(alert) {
  if (!alert) return true;
  const id = alert._id || alert.id || alert.title;
  const readSet = getReadAlertIds();
  if (id && readSet.has(id)) return true;

  const lastRead = getLastReadTimestamp();
  if (lastRead > 0 && alert.createdAt) {
    const created = new Date(alert.createdAt).getTime();
    if (!isNaN(created) && created <= lastRead) {
      return true;
    }
  }
  return false;
}

export function markAlertAsRead(alertOrId) {
  const id = typeof alertOrId === 'string' ? alertOrId : (alertOrId?._id || alertOrId?.id || alertOrId?.title);
  if (!id) return;
  try {
    const readSet = getReadAlertIds();
    readSet.add(id);
    localStorage.setItem(READ_ALERT_IDS_KEY, JSON.stringify(Array.from(readSet)));
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { type: 'single', id } }));
  } catch (e) {
    console.warn('Failed to save read alert:', e);
  }
}

export function markAllAlertsAsRead(alerts = []) {
  try {
    const readSet = getReadAlertIds();
    alerts.forEach((a) => {
      const id = a._id || a.id || a.title;
      if (id) readSet.add(id);
    });
    localStorage.setItem(READ_ALERT_IDS_KEY, JSON.stringify(Array.from(readSet)));
    localStorage.setItem(LAST_READ_TIME_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { type: 'all' } }));
  } catch (e) {
    console.warn('Failed to mark all alerts as read:', e);
  }
}

export function getUnreadAlerts(alerts = [], location = null, alertMatchesLocationFn = null) {
  const active = (alerts || []).filter((a) => a.isActive !== false);
  let scoped = active;
  if (location && alertMatchesLocationFn) {
    const local = active.filter((a) => alertMatchesLocationFn(a, location));
    scoped = local.length > 0 ? local : active;
  }
  return scoped.filter((a) => !isAlertRead(a));
}
