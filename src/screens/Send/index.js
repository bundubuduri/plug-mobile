import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Text, ScrollView, Keyboard } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import TextInput from '../../components/common/TextInput';
import { ADDRESS_TYPES } from '../../constants/addresses';
import ContactSection from './components/ContactSection';
import AmountSection from './components/AmountSection';
import TokenSection from './components/TokenSection';
import { getICPPrice } from '../../redux/slices/icp';
import Header from '../../components/common/Header';
import { FontStyles } from '../../constants/theme';
import SaveContact from './components/SaveContact';
import ReviewSend from './components/ReviewSend';
import { USD_PER_TC } from '../../utils/assets';
import useKeychain from '../../hooks/useKeychain';
import XTC_OPTIONS from '../../constants/xtc';
import Modal from '../../components/modal';
import {
  burnXtc,
  sendToken,
  setTransaction,
  transferNFT,
} from '../../redux/slices/user';
import styles from './styles';
import {
  validatePrincipalId,
  validateAccountId,
  validateCanisterId,
} from '../../helpers/ids';
import {
  getAvailableAmount,
  getUsdAvailableAmount,
  formatSendAmount,
  USD_MAX_DECIMALS,
  ICP_MAX_DECIMALS,
} from './utils';

const INITIAL_ADDRESS_INFO = { isValid: null, type: null };

const Send = ({ modalRef, nft, token, onSuccess }) => {
  const dispatch = useDispatch();
  const { isSensorAvailable, getPassword } = useKeychain();
  const { icpPrice } = useSelector(state => state.icp);
  const { currentWallet } = useSelector(state => state.keyring);
  const { assets, transaction, collections, usingBiometrics, contacts } =
    useSelector(state => state.user);

  const reviewRef = useRef(null);
  const saveContactRef = useRef(null);

  const nfts =
    collections?.flatMap(collection => collection?.tokens || []) || [];
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usdAmount, setUsdAmount] = useState(null);
  const [destination] = useState(XTC_OPTIONS.SEND);
  const [selectedNft, setSelectedNft] = useState(nft);
  const [tokenAmount, setTokenAmount] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedTokenPrice, setSelectedTokenPrice] = useState(null);
  const [addressInfo, setAddressInfo] = useState(INITIAL_ADDRESS_INFO);
  const [sendingXTCtoCanister, setSendingXTCtoCanister] = useState(false);

  const isValidAddress = addressInfo.isValid;
  const to = address || selectedContact?.id;

  useEffect(() => {
    const savedContact = contacts.find(c => c.id === address);
    if (savedContact) {
      setSelectedContact(savedContact);
    }
  }, [contacts, address]);

  useEffect(() => {
    dispatch(getICPPrice());
  }, []);

  const onContactPress = contact => {
    Keyboard.dismiss();
    setAddress(null);
    setSelectedContact(contact);
  };

  const onTokenPress = pressedToken => {
    setSelectedToken(pressedToken);
    setSelectedNft(null);
  };

  const onNftPress = pressedNFT => {
    setSelectedNft(pressedNFT);
    setSelectedToken(null);
    onReview();
  };

  const resetState = () => {
    setAddress(null);
    setAddressInfo(INITIAL_ADDRESS_INFO);
    setSelectedNft(null);
    setSelectedToken(null);
    setSelectedContact(null);
    setUsdAmount(null);
    setTokenAmount(null);
    dispatch(setTransaction(null));
  };

  const partialReset = () => {
    setSelectedNft(null);
  };

  const onChangeText = text => {
    setSelectedContact(null);
    setAddress(text);
  };

  const onReview = () => {
    Keyboard.dismiss();
    reviewRef.current?.open();
  };

  const handleSendNFT = () => {
    dispatch(transferNFT({ to, nft: selectedNft, icpPrice }))
      .unwrap()
      .then(() => {
        setLoading(false);
      });
  };

  const handleSendToken = () => {
    if (sendingXTCtoCanister && destination === XTC_OPTIONS.BURN) {
      dispatch(burnXtc({ to, amount: tokenAmount }));
    } else {
      dispatch(
        sendToken({
          to,
          amount: tokenAmount,
          canisterId: selectedToken?.canisterId,
          icpPrice,
        }),
      )
        .unwrap()
        .then(response => {
          if (response.status) {
            setLoading(false);
          }
        });
    }
  };

  const handleSend = async () => {
    setLoading(true);
    const isBiometricsAvailable = await isSensorAvailable();

    const send = () => {
      if (selectedNft) {
        handleSendNFT();
      } else {
        handleSendToken();
      }
    };

    if (isBiometricsAvailable && usingBiometrics) {
      const biometrics = await getPassword();
      if (biometrics) {
        send();
      } else {
        setLoading(false);
      }
    } else {
      send();
    }
  };

  useEffect(() => {
    if (!selectedToken && nft) {
      setSelectedNft(nft);
    }
  }, [nft, isValidAddress]);

  useEffect(() => {
    if (!selectedNft && token) {
      setSelectedToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (selectedNft && (isValidAddress || selectedContact)) {
      onReview();
    }
  }, [selectedNft, isValidAddress, selectedContact]);

  useEffect(() => {
    if (selectedToken) {
      const price =
        { ICP: icpPrice, XTC: USD_PER_TC, WTC: USD_PER_TC }[
          selectedToken?.symbol
        ] || 1;
      setSelectedTokenPrice(price);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (address || selectedContact) {
      const id = address || selectedContact.id;
      const isUserAddress = [
        currentWallet?.principal,
        currentWallet?.accountId,
      ].includes(id);
      let isValid =
        !isUserAddress && (validatePrincipalId(id) || validateAccountId(id));
      const type = validatePrincipalId(id)
        ? ADDRESS_TYPES.PRINCIPAL
        : ADDRESS_TYPES.ACCOUNT;
      // check for accountId if cycles selected
      if (type === ADDRESS_TYPES.ACCOUNT && selectedToken?.symbol !== 'ICP') {
        isValid = false;
      }
      setAddressInfo({ isValid, type });
      setSendingXTCtoCanister(
        selectedToken?.symbol === 'XTC' && validateCanisterId(id),
      );
    }
  }, [address, selectedContact, selectedToken]);

  const availableAmount = useMemo(
    () =>
      formatSendAmount(
        getAvailableAmount(selectedToken?.amount, selectedToken?.symbol),
        ICP_MAX_DECIMALS,
      ),
    [selectedToken],
  );
  const availableUsdAmount = useMemo(
    () =>
      formatSendAmount(
        getUsdAvailableAmount(availableAmount, selectedTokenPrice),
        USD_MAX_DECIMALS,
      ),
    [availableAmount, selectedTokenPrice],
  );

  const getSaveContactRef = () => {
    if (selectedContact || !isValidAddress) {
      return null;
    } else {
      return saveContactRef;
    }
  };

  const handleBack = () => {
    setAddress(null);
    setSelectedContact(null);
    setAddressInfo(INITIAL_ADDRESS_INFO);
  };

  return (
    <Modal modalRef={modalRef} onClose={resetState}>
      <Header
        left={
          isValidAddress && (
            <Text
              style={[FontStyles.Normal, styles.valid]}
              onPress={handleBack}>
              Back
            </Text>
          )
        }
        center={<Text style={FontStyles.Subtitle2}>Send</Text>}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        keyboardShouldPersistTaps="always">
        <TextInput
          label="To:"
          placeholder="Name or address"
          variant="innerLabel"
          hideGradient
          value={selectedContact ? selectedContact.name : address}
          onChangeText={onChangeText}
          textStyle={isValidAddress ? styles.valid : null}
          autoFocus
          saveContactRef={getSaveContactRef()}
        />
        {!isValidAddress && (
          <ContactSection filterText={address} onPress={onContactPress} />
        )}
        {isValidAddress && !selectedToken && (
          <TokenSection
            tokens={assets}
            nfts={nfts}
            onTokenPress={onTokenPress}
            onNftPress={onNftPress}
          />
        )}
        {isValidAddress && selectedToken && (
          <AmountSection
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            tokenPrice={selectedTokenPrice}
            tokenAmount={tokenAmount}
            setTokenAmount={setTokenAmount}
            usdAmount={usdAmount}
            setUsdAmount={setUsdAmount}
            availableAmount={availableAmount}
            availableUsdAmount={availableUsdAmount}
            onReview={onReview}
          />
        )}
        <ReviewSend
          modalRef={reviewRef}
          adjustToContentHeight
          token={selectedToken}
          to={selectedContact ? selectedContact?.id : address}
          contact={selectedContact}
          amount={tokenAmount}
          tokenPrice={selectedTokenPrice}
          value={usdAmount}
          nft={selectedNft}
          onSend={handleSend}
          onSuccess={() => {
            modalRef.current?.close();
            if (onSuccess) {
              onSuccess();
            }
          }}
          onClose={partialReset}
          transaction={transaction}
          loading={loading}
        />
        <SaveContact id={address} modalRef={saveContactRef} />
      </ScrollView>
    </Modal>
  );
};

export default Send;
