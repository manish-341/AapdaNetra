import { playEmergencySiren } from './emergencyAudio';

/**
 * Request permission and dispatch browser push notification for disaster alert
 */
export async function triggerDisasterNotification({
  title = 'Critical Disaster Alert',
  body = 'Immediate emergency action required in your district.',
  sound = true
}) {
  if (sound) {
    playEmergencySiren(8000);
  }

  if (!('Notification' in window)) {
    console.warn('[AapdaNetra Notifications] Browser does not support Notification API.');
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const notification = new Notification(`🚨 AAPDANETRA: ${title}`, {
        body,
        icon: '/favicon.ico',
        tag: 'aapdanetra-disaster-alert',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    }
  } catch (err) {
    console.warn('[AapdaNetra Notifications] Notification trigger error:', err);
  }

  return false;
}
