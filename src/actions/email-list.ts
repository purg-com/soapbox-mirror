import api from '../api/index.ts';

import type { RootState } from 'soapbox/store.ts';

const getSubscribersCsv = () =>
  (dispatch: any, getState: () => RootState) =>
    api(getState).get('/api/v1/pleroma/admin/email_list/subscribers.csv');

const getUnsubscribersCsv = () =>
  (dispatch: any, getState: () => RootState) =>
    api(getState).get('/api/v1/pleroma/admin/email_list/unsubscribers.csv');

const getCombinedCsv = () =>
  (dispatch: any, getState: () => RootState) =>
    api(getState).get('/api/v1/pleroma/admin/email_list/combined.csv');

export {
  getSubscribersCsv,
  getUnsubscribersCsv,
  getCombinedCsv,
};
