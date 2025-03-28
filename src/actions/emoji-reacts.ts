import { List as ImmutableList } from 'immutable';

import { isLoggedIn } from 'soapbox/utils/auth.ts';

import api from '../api/index.ts';

import { importFetchedAccounts, importFetchedStatus } from './importer/index.ts';
import { favourite, unfavourite } from './interactions.ts';

import type { AppDispatch, RootState } from 'soapbox/store.ts';
import type { APIEntity, EmojiReaction, Status } from 'soapbox/types/entities.ts';

const EMOJI_REACT_REQUEST = 'EMOJI_REACT_REQUEST';
const EMOJI_REACT_SUCCESS = 'EMOJI_REACT_SUCCESS';
const EMOJI_REACT_FAIL    = 'EMOJI_REACT_FAIL';

const UNEMOJI_REACT_REQUEST = 'UNEMOJI_REACT_REQUEST';
const UNEMOJI_REACT_SUCCESS = 'UNEMOJI_REACT_SUCCESS';
const UNEMOJI_REACT_FAIL    = 'UNEMOJI_REACT_FAIL';

const EMOJI_REACTS_FETCH_REQUEST = 'EMOJI_REACTS_FETCH_REQUEST';
const EMOJI_REACTS_FETCH_SUCCESS = 'EMOJI_REACTS_FETCH_SUCCESS';
const EMOJI_REACTS_FETCH_FAIL    = 'EMOJI_REACTS_FETCH_FAIL';

const noOp = () => () => new Promise(f => f(undefined));

const simpleEmojiReact = (status: Status, emoji: string, custom?: string) =>
  (dispatch: AppDispatch) => {
    const emojiReacts: ImmutableList<EmojiReaction> = status.reactions || ImmutableList();

    if (emoji === '👍' && status.favourited) return dispatch(unfavourite(status));

    const undo = emojiReacts.filter(e => e.me === true && e.name === emoji).count() > 0;
    if (undo) return dispatch(unEmojiReact(status, emoji));

    return Promise.all([
      ...emojiReacts
        .filter((emojiReact) => emojiReact.me === true)
        .map(emojiReact => dispatch(unEmojiReact(status, emojiReact.name))).toArray(),
      status.favourited && dispatch(unfavourite(status)),
    ]).then(() => {
      if (emoji === '👍') {
        dispatch(favourite(status));
      } else {
        dispatch(emojiReact(status, emoji, custom));
      }
    }).catch(err => {
      console.error(err);
    });
  };

const fetchEmojiReacts = (id: string, emoji: string) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    if (!isLoggedIn(getState)) return dispatch(noOp());

    dispatch(fetchEmojiReactsRequest(id, emoji));

    const url = emoji
      ? `/api/v1/pleroma/statuses/${id}/reactions/${emoji}`
      : `/api/v1/pleroma/statuses/${id}/reactions`;

    return api(getState).get(url).then((response) => response.json()).then((data) => {
      data.forEach((emojiReact: APIEntity) => {
        dispatch(importFetchedAccounts(emojiReact.accounts));
      });
      dispatch(fetchEmojiReactsSuccess(id, data));
    }).catch(error => {
      dispatch(fetchEmojiReactsFail(id, error));
    });
  };

const emojiReact = (status: Status, emoji: string, custom?: string) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    if (!isLoggedIn(getState)) return dispatch(noOp());

    dispatch(emojiReactRequest(status, emoji, custom));

    return api(getState)
      .put(`/api/v1/pleroma/statuses/${status.id}/reactions/${emoji}`)
      .then((response) => response.json()).then((data) => {
        dispatch(importFetchedStatus(data));
        dispatch(emojiReactSuccess(status, emoji));
      }).catch((error) => {
        dispatch(emojiReactFail(status, emoji, error));
      });
  };

const unEmojiReact = (status: Status, emoji: string) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    if (!isLoggedIn(getState)) return dispatch(noOp());

    dispatch(unEmojiReactRequest(status, emoji));

    return api(getState)
      .delete(`/api/v1/pleroma/statuses/${status.id}/reactions/${emoji}`)
      .then((response) => response.json()).then((data) => {
        dispatch(importFetchedStatus(data));
        dispatch(unEmojiReactSuccess(status, emoji));
      }).catch(error => {
        dispatch(unEmojiReactFail(status, emoji, error));
      });
  };

const fetchEmojiReactsRequest = (id: string, emoji: string) => ({
  type: EMOJI_REACTS_FETCH_REQUEST,
  id,
  emoji,
});

const fetchEmojiReactsSuccess = (id: string, emojiReacts: APIEntity[]) => ({
  type: EMOJI_REACTS_FETCH_SUCCESS,
  id,
  emojiReacts,
});

const fetchEmojiReactsFail = (id: string, error: unknown) => ({
  type: EMOJI_REACTS_FETCH_FAIL,
  id,
  error,
});

const emojiReactRequest = (status: Status, emoji: string, custom?: string) => ({
  type: EMOJI_REACT_REQUEST,
  status,
  emoji,
  custom,
  skipLoading: true,
});

const emojiReactSuccess = (status: Status, emoji: string) => ({
  type: EMOJI_REACT_SUCCESS,
  status,
  emoji,
  skipLoading: true,
});

const emojiReactFail = (status: Status, emoji: string, error: unknown) => ({
  type: EMOJI_REACT_FAIL,
  status,
  emoji,
  error,
  skipLoading: true,
});

const unEmojiReactRequest = (status: Status, emoji: string) => ({
  type: UNEMOJI_REACT_REQUEST,
  status,
  emoji,
  skipLoading: true,
});

const unEmojiReactSuccess = (status: Status, emoji: string) => ({
  type: UNEMOJI_REACT_SUCCESS,
  status,
  emoji,
  skipLoading: true,
});

const unEmojiReactFail = (status: Status, emoji: string, error: unknown) => ({
  type: UNEMOJI_REACT_FAIL,
  status,
  emoji,
  error,
  skipLoading: true,
});

export {
  EMOJI_REACT_REQUEST,
  EMOJI_REACT_SUCCESS,
  EMOJI_REACT_FAIL,
  UNEMOJI_REACT_REQUEST,
  UNEMOJI_REACT_SUCCESS,
  UNEMOJI_REACT_FAIL,
  EMOJI_REACTS_FETCH_REQUEST,
  EMOJI_REACTS_FETCH_SUCCESS,
  EMOJI_REACTS_FETCH_FAIL,
  simpleEmojiReact,
  fetchEmojiReacts,
  emojiReact,
  unEmojiReact,
  fetchEmojiReactsRequest,
  fetchEmojiReactsSuccess,
  fetchEmojiReactsFail,
  emojiReactRequest,
  emojiReactSuccess,
  emojiReactFail,
  unEmojiReactRequest,
  unEmojiReactSuccess,
  unEmojiReactFail,
};
