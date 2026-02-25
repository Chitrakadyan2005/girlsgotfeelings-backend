const MAX_HISTORY = 6;

const memoryStore = new Map();
const lastCommunityStore = new Map();

function getKey(userId, communityId) {
  return `${userId}:${communityId}`;
}

function getHistory(userId, communityId) {
  return memoryStore.get(getKey(userId, communityId)) || [];
}

function addMessage(userId, communityId, role, content) {
  const key = getKey(userId, communityId);
  const history = memoryStore.get(key) || [];

  history.push({ role, content });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  memoryStore.set(key, history);
  lastCommunityStore.set(userId, communityId);
}

function clearHistory(userId, communityId) {
  memoryStore.delete(getKey(userId, communityId));
}

function clearAllUserHistory(userId) {
  // remove all communities for this user
  for (const key of memoryStore.keys()) {
    if (key.startsWith(`${userId}:`)) {
      memoryStore.delete(key);
    }
  }
}

function getLastCommunity(userId) {
  return lastCommunityStore.get(userId);
}

module.exports = {
  getHistory,
  addMessage,
  clearHistory,
  clearAllUserHistory,
  getLastCommunity,
};