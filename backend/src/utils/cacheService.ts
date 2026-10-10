import NodeCache from 'node-cache';

// stdTTL: Default time-to-live is 5 minutes (300 seconds)
// checkperiod: Delete expired keys every 60 seconds
export const appCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
