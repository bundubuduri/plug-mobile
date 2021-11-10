import { useDispatch, useSelector } from 'react-redux';
//import getRandom from '../helpers/random';
import bip39 from 'react-native-bip39';
import {
  setCurrentWallet,
  setAssets,
  setUnlocked,
} from '../redux/slices/keyring';

const generateMnemonic = async () => {
  try {
    return await bip39.generateMnemonic(128);
  } catch (e) {
    console.log(e);
    return false;
  }
};

const useKeyring = () => {
  const { instance } = useSelector(state => state.keyring);
  const dispatch = useDispatch();

  const createWallet = async password => {
    const mnemonic = await generateMnemonic();
    const response = await instance?.importMnemonic({ password, mnemonic });
    const { wallet } = response || {};
    await instance?.unlock(password);
    dispatch(setCurrentWallet(wallet));
    return mnemonic;
  };

  const importWallet = async params => {
    const response = await instance?.importMnemonic(params);
    const { wallet, mnemonic } = response || {};
    await instance?.unlock(params.password);
    dispatch(setCurrentWallet(wallet));
    return mnemonic;
  };

  const getAssets = async refresh => {
    const response = await instance?.getState();
    const { wallets, currentWalletId } = response || {};
    let assets = wallets?.[currentWalletId]?.assets || [];
    if (assets?.every(asset => !asset.amount) || refresh) {
      assets = await instance?.getBalance();
    } else {
      instance?.getBalance();
    }
    dispatch(setAssets(assets));
    return assets;
  };

  const getState = async () => {
    const response = await instance?.getState();
    if (!response.wallets.length) {
      await instance?.lock();
    } else {
      const { wallets, currentWalletId } = response || {};
      dispatch(setCurrentWallet(wallets[currentWalletId]));
      return response;
    }
  };

  const unlock = async password => {
    let unlocked = false;
    try {
      unlocked = await instance.unlock(password);
      dispatch(setUnlocked(unlocked));
    } catch (e) {
      unlocked = false;
    }
    setUnlocked(unlocked);
    return unlocked;
  };

  return {
    keyring: instance,
    createWallet,
    importWallet,
    getAssets,
    getState,
    unlock,
  };
};

export default useKeyring;
