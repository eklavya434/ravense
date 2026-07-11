import webpush from 'web-push';
import { getPushSubscriptions, deletePushSubscription } from './data';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:eklavya434@gmail.com',
    publicKey,
    privateKey
  );
} else {
  console.warn('VAPID credentials are not configured. Web Push Notifications will fail to deliver.');
}

export async function sendPushNotification(subscription: any, payload: any) {
  if (!publicKey || !privateKey) return;
  try {
    // The keys field in db is parsed if stored as string, otherwise read as JSON object
    const subConfig = typeof subscription.keys === 'string' 
      ? JSON.parse(subscription.keys) 
      : subscription.keys;

    const pushObject = {
      endpoint: subscription.endpoint,
      keys: subConfig.keys || subConfig
    };

    await webpush.sendNotification(pushObject, JSON.stringify(payload));
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.warn(`Push subscription expired (HTTP ${error.statusCode}). Removing endpoint: ${subscription.endpoint}`);
      await deletePushSubscription(subscription.endpoint);
    } else {
      console.error(`Web Push delivery failed to ${subscription.endpoint}:`, error);
    }
  }
}

export async function triggerIngestionNotifications(
  newArticlesList: Array<{ headline: string; slug: string; category: string }>
) {
  if (newArticlesList.length === 0) return;

  if (newArticlesList.length === 1) {
    const article = newArticlesList[0];
    const payload = {
      title: `New in ${article.category.toUpperCase()}`,
      body: article.headline,
      url: `/article/${article.slug}`
    };

    const subs = await getPushSubscriptions(article.category);
    await Promise.all(subs.map(sub => sendPushNotification(sub, payload)));
  } else {
    const categoriesSet = new Set(newArticlesList.map(a => a.category));
    const categoriesStr = Array.from(categoriesSet).map(c => c.toUpperCase()).join(', ');

    const payload = {
      title: `${newArticlesList.length} New Dispatches Ingested`,
      body: `Channels updated: ${categoriesStr}. Tap to review raw dispatches.`,
      url: '/'
    };

    const subs = await getPushSubscriptions();
    await Promise.all(subs.map(sub => sendPushNotification(sub, payload)));
  }
}
