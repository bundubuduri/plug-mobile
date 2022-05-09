import { Alert, AppState, InteractionManager, Linking } from 'react-native';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import WalletConnect from '@walletconnect/client';
import { parseWalletConnectUri } from '@walletconnect/utils';
import URL, { qs } from 'url-parse';
import { captureException } from '@sentry/react-native';
import Minimizer from 'react-native-minimizer';

import Navigation from '../../helpers/navigation';
import {
  getAllValidWalletConnectSessions,
  saveWalletConnectSession,
} from '../../utils/walletConnect';
import { delay } from '../../utils/utilities';
import Routes from '../../navigation/Routes';

// -- Variables --------------------------------------- //
let showRedirectSheetThreshold = 300;

// -- Constants --------------------------------------- //
const BIOMETRICS_ANIMATION_DELAY = 569;

const IS_TESTING = false;

// -- Actions ---------------------------------------- //
const getNativeOptions = async () => {
  const nativeOptions = {
    clientMeta: {
      description: 'Plug IC Wallet ',
      icons: [],
      name: 'Plug Wallet',
      url: 'https://plugwallet.ooo',
    },
  };

  return nativeOptions;
};

export const walletConnectSetPendingRedirect = createAsyncThunk(
  'walletconnect/setPendingRedirect',
  (params, { getState, dispatch }) => {
    dispatch(setPendingRedirect());
  },
);

export const walletConnectRemovePendingRedirect = createAsyncThunk(
  'walletconnect/removePendingRedirect',
  ({ type, scheme }, { dispatch }) => {
    dispatch(removePendingRedirect());
    const lastActiveTime = new Date().getTime();
    if (scheme) {
      Linking.openURL(`${scheme}://`);
    } else if (type !== 'timedOut') {
      if (type === 'sign' || type === 'transaction') {
        showRedirectSheetThreshold += BIOMETRICS_ANIMATION_DELAY;
        setTimeout(() => {
          Minimizer.goBack();
        }, BIOMETRICS_ANIMATION_DELAY);
      } else if (type === 'sign-canceled' || type === 'transaction-canceled') {
        setTimeout(() => {
          Minimizer.goBack();
        }, 300);
      } else {
        Minimizer.goBack();
      }
      // If it's still active after showRedirectSheetThreshold
      // We need to show the redirect sheet cause the redirect
      // didn't work
      setTimeout(() => {
        const now = new Date().getTime();
        const delta = now - lastActiveTime;
        if (AppState.currentState === 'active' && delta < 1000) {
          return Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
            type,
          });
        }
        return;
      }, showRedirectSheetThreshold);
    }
  },
);

export const walletConnectOnSessionRequest = createAsyncThunk(
  'walletconnect/onSessionRequest',
  async ({ uri, callback }, { dispatch, getState }) => {
    let timeout = null;
    let walletConnector = null;
    const receivedTimestamp = Date.now();
    try {
      const { clientMeta } = await getNativeOptions();
      try {
        // Don't initiate a new session if we have already established one using this walletconnect URI
        const allSessions = await getAllValidWalletConnectSessions();
        const wcUri = parseWalletConnectUri(uri);
        const alreadyConnected = Object.values(allSessions).some(session => {
          return (
            session.handshakeTopic === wcUri.handshakeTopic &&
            session.key === wcUri.key
          );
        });

        if (alreadyConnected) {
          return;
        }

        walletConnector = new WalletConnect({
          clientMeta,
          uri,
        });
        let meta = null;
        let navigated = false;
        let timedOut = false;
        let routeParams = {
          callback: async (
            approved,
            chainId,
            accountAddress,
            peerId,
            dappScheme,
            dappName,
            dappUrl,
          ) => {
            if (approved) {
              dispatch(setPendingRequest({ peerId, walletConnector }));
              dispatch(
                walletConnectApproveSession({
                  peerId,
                  callback,
                  dappScheme,
                  chainId,
                  accountAddress,
                }),
              );
            } else if (!timedOut) {
              await dispatch(
                walletConnectRejectSession(peerId, walletConnector),
              );
              callback?.('reject', dappScheme);
            } else {
              callback?.('timedOut', dappScheme);
              const url = new URL(uri);
              const bridge = qs.parse(url?.query)?.bridge;
            }
          },
          receivedTimestamp,
        };

        walletConnector?.on('session_request', (error, payload) => {
          clearTimeout(timeout);
          if (error) {
            captureException(error);
            throw error;
          }
          const { peerId, peerMeta, chainId } = payload.params[0];

          const dappName = peerMeta?.name;
          const dappUrl = peerMeta?.url;
          const dappScheme = peerMeta?.scheme;

          meta = {
            chainId,
            dappName,
            dappScheme,
            dappUrl,
            peerId,
          };

          // If we already showed the sheet
          // We need navigate to the same route with the updated params
          // which now includes the meta
          if (navigated && !timedOut) {
            routeParams = { ...routeParams, meta, timeout };
            Navigation.handleAction(
              Routes.WALLET_CONNECT_APPROVAL_SHEET,
              routeParams,
            );
          }
        });

        let waitingFn = InteractionManager.runAfterInteractions;
        if (IS_TESTING === 'true') {
          waitingFn = setTimeout;
        }

        waitingFn(async () => {
          if (IS_TESTING !== 'true') {
            // Wait until the app is idle so we can navigate
            // This usually happens only when coming from a cold start
            // while (!getState().appState.walletReady) {
            //   console.log('INTO WAITING FN - delay');
            //   //await delay(300);
            // }
          }

          // We need to add a timeout in case the bridge is down
          // to explain the user what's happening
          timeout = setTimeout(() => {
            if (meta) return;
            timedOut = true;
            routeParams = { ...routeParams, timedOut };
            Navigation.handleAction(
              Routes.WALLET_CONNECT_APPROVAL_SHEET,
              routeParams,
            );
          }, 20000);

          // If we have the meta, send it
          if (meta) {
            routeParams = { ...routeParams, meta };
          }
          navigated = true;
          Navigation.handleAction(
            Routes.WALLET_CONNECT_APPROVAL_SHEET,
            routeParams,
          );
        }, 2000);
      } catch (error) {
        clearTimeout(timeout);
        captureException(error);
        Alert.alert('wallet.wallet_connect.error');
      }
    } catch (error) {
      clearTimeout(timeout);
      captureException(error);
      Alert.alert('wallet.wallet_connect.missing_fcm');
    }
  },
);

const listenOnNewMessages = walletConnector => (dispatch, getState) => {
  walletConnector.on('call_request', async (error, payload) => {
    console.log('WC Request!', error, payload);
    if (error) {
      throw error;
    }
    const { clientId, peerId, peerMeta } = walletConnector;
    const imageUrl = '';
    const dappName = peerMeta?.name;
    const dappUrl = peerMeta?.url;
    const requestId = payload.id;

    const address = walletConnector._accounts?.[0];

    // const { requests: pendingRequests } = getState().requests;
    // const request = !pendingRequests[requestId]
    //   ? dispatch(
    //       addRequestToApprove(clientId, peerId, requestId, payload, peerMeta),
    //     )
    //   : null;
    // if (request) {
    //   Navigation.handleAction(Routes.CONFIRM_REQUEST, {
    //     openAutomatically: true,
    //     transactionDetails: request,
    //   });
    //   InteractionManager.runAfterInteractions(() => {
    //     analytics.track('Showing Walletconnect signing request');
    //   });
    // }
  });
  walletConnector.on('disconnect', error => {
    console.log('WC Disconnect!', error);

    if (error) {
      throw error;
    }
  });
  return walletConnector;
};

export const setPendingRequest = createAsyncThunk(
  'walletconnect/setPendingRequest',
  ({ peerId, walletConnector }, { dispatch, getState }) => {
    const state = getState();
    const { pendingRequests } = state.walletconnect;
    const updatedPendingRequests = {
      ...pendingRequests,
      [peerId]: walletConnector,
    };
    dispatch(updateRequests(updatedPendingRequests));
  },
);

export const getPendingRequest = createAsyncThunk(
  'walletconnect/getPendingRequest',
  ({ peerId }, { dispatch, getState }) => {
    const { pendingRequests } = getState().walletconnect;
    return pendingRequests[peerId];
  },
);

export const removePendingRequest = createAsyncThunk(
  'walletconnect/removePendingRequest',
  ({ peerId }, { dispatch, getState }) => {
    const { pendingRequests } = getState().walletconnect;
    const updatedPendingRequests = pendingRequests;
    if (updatedPendingRequests[peerId]) {
      delete updatedPendingRequests[peerId];
    }
    dispatch(updateRequests(updatedPendingRequests));
  },
);

export const setWalletConnector = createAsyncThunk(
  'walletconnect/setWalletConnector',
  ({ walletConnector }, { dispatch, getState }) => {
    const { walletConnectors } = getState().walletconnect;
    const updatedWalletConnectors = {
      ...walletConnectors,
      [walletConnector.peerId]: walletConnector,
    };
    dispatch(updateConnectors(updatedWalletConnectors));
  },
);

export const getWalletConnector = createAsyncThunk(
  'walletconnect/getWalletConnector',
  ({ peerId }, { dispatch, getState }) => {
    const { walletConnectors } = getState().walletconnect;
    const walletConnector = walletConnectors[peerId];
    return walletConnector;
  },
);

export const removeWalletConnector = createAsyncThunk(
  'walletconnect/removeWalletConnector',
  ({ peerId }, { dispatch, getState }) => {
    const { walletConnectors } = getState().walletconnect;
    const updatedWalletConnectors = walletConnectors;
    if (updatedWalletConnectors[peerId]) {
      delete updatedWalletConnectors[peerId];
    }
    dispatch(updateConnectors(updatedWalletConnectors));
  },
);

export const walletConnectApproveSession = createAsyncThunk(
  'walletconnect/approveSession',
  async (
    { peerId, callback, dappScheme, chainId, accountAddress },
    { dispatch, getState },
  ) => {
    const { pendingRequests } = getState().walletconnect;
    const walletConnector = pendingRequests[peerId];

    walletConnector.approveSession({
      accounts: [
        'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEPdfv1T20KMFZRKBYZZDTDMSZ5MWw/+ReiwC9GF6LAUFTER1TZN4qdkXETOHDP0R6UkS6VD0jIjHyPov6pM4Qtw==',
      ],
      chainId,
    });

    dispatch(removePendingRequest({ peerId }));
    saveWalletConnectSession(walletConnector.peerId, walletConnector.session);

    const listeningWalletConnector = dispatch(
      listenOnNewMessages(walletConnector),
    );

    dispatch(setWalletConnector({ walletConnector: listeningWalletConnector }));
    if (callback) {
      callback('connect', dappScheme);
    }
  },
);

export const walletConnectRejectSession = createAsyncThunk(
  'walletconnect/rejectSession',
  ([peerId, walletConnector], { dispatch }) => {
    walletConnector.rejectSession();
    dispatch(removePendingRequest({ peerId }));
  },
);

// -- Reducer ----------------------------------------- //
const DEFAULT_STATE = {
  pendingRedirect: false,
  pendingRequests: {},
  walletConnectors: {},
};

export const walletconnectSlice = createSlice({
  name: 'walletconnect',
  initialState: DEFAULT_STATE,
  reducers: {
    updateRequests: (state, action) => {
      return {
        ...state,
        pendingRequests: action.payload,
      };
    },
    updateConnectors: (state, action) => {
      return {
        ...state,
        walletConnectors: action.payload,
      };
    },
    clearState: (state, action) => {
      return {
        ...state,
        ...DEFAULT_STATE,
      };
    },
    setPendingRedirect: (state, action) => {
      return {
        ...state,
        pendingRedirect: true,
      };
    },
    removePendingRedirect: (state, action) => {
      return {
        ...state,
        pendingRedirect: false,
      };
    },
  },
  extraReducers: {},
});

export const {
  updateRequests,
  updateConnectors,
  clearState,
  setPendingRedirect,
  removePendingRedirect,
} = walletconnectSlice.actions;

export default walletconnectSlice.reducer;