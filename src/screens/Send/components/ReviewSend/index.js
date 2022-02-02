import { Text, View, Linking } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import RainbowButton from '../../../../components/buttons/RainbowButton';
import NftDisplayer from '../../../../components/common/NftDisplayer';
import { getICRocksTransactionUrl } from '../../../../constants/urls';
import TokenFormat from '../../../../components/number/TokenFormat';
import { Colors, FontStyles } from '../../../../constants/theme';
import { TRANSACTION_STATUS } from '../../../../redux/constants';
import TokenIcon from '../../../../components/tokens/TokenIcon';
import { setTransaction } from '../../../../redux/slices/user';
import UserIcon from '../../../../components/common/UserIcon';
import shortAddress from '../../../../helpers/short-address';
import Button from '../../../../components/buttons/Button';
import Header from '../../../../components/common/Header';
import Column from '../../../../components/layout/Column';
import useGetType from '../../../../hooks/useGetType';
import Row from '../../../../components/layout/Row';
import Modal from '../../../../components/modal';
import Icon from '../../../../components/icons';
import styles from './styles';
import SaveContact from '../SaveContact';

const ReviewSend = ({
  modalRef,
  token,
  nft,
  amount,
  value,
  to,
  contact,
  onSend,
  onClose,
  onSuccess,
  transaction,
  loading,
  ...props
}) => {
  const dispatch = useDispatch();
  const [nftType, setNftType] = useState(null);
  const contacts = useSelector(state => state.user.contacts, shallowEqual);
  const [selectedContact, setSelectedContact] = useState(contact || null);

  const saveContactRef = useRef(null);
  const handleSaveContact = () => {
    saveContactRef.current?.open();
  };

  useGetType(nft?.url, setNftType);

  useEffect(() => {
    setSelectedContact(contacts.find(c => c.id === to));
  }, [contacts]);

  const transactionCompleted =
    transaction?.status === TRANSACTION_STATUS.success;

  const handleClose = () => {
    onClose();
    dispatch(setTransaction(null));

    if (transactionCompleted) {
      onSuccess();
    }
  };

  return (
    <Modal modalRef={modalRef} onClose={handleClose} {...props}>
      <View style={styles.content}>
        <Header
          center={
            <Text style={FontStyles.Subtitle2}>
              {transactionCompleted ? 'Confirmed' : 'Review Send'}
            </Text>
          }
        />
        {transactionCompleted && <Icon name="confirm" style={styles.icon} />}
        {token && (
          <Row style={styles.row}>
            <Column>
              <Text style={FontStyles.Title2}>${value}</Text>
              <Text style={FontStyles.Subtitle3}>
                <TokenFormat value={amount} token={token.symbol} />
              </Text>
            </Column>
            <TokenIcon {...token} color={Colors.Gray.Tertiary} />
          </Row>
        )}
        {nft && (
          <Row style={styles.row}>
            <Column>
              <Text style={FontStyles.Title2}>
                {nft.name || `${nft.collection} #${nft.index}`}
              </Text>
            </Column>
            <NftDisplayer url={nft.url} type={nftType} isSend />
          </Row>
        )}
        <Row style={[styles.row, styles.toRow]}>
          <View style={styles.to}>
            <Text style={FontStyles.Normal}>To</Text>
          </View>
          <Icon name="arrowDown" />
        </Row>
        <Row style={styles.row}>
          <Column>
            {selectedContact ? (
              <>
                <Text style={FontStyles.Title2}>{selectedContact?.name}</Text>
                <Text style={FontStyles.Subtitle3}>
                  {shortAddress(selectedContact?.id)}
                </Text>
              </>
            ) : (
              <>
                <Text style={FontStyles.Title2}>{shortAddress(to)}</Text>
                <Text
                  style={[FontStyles.Normal, styles.valid]}
                  onPress={handleSaveContact}>
                  Save as contact
                </Text>
              </>
            )}
          </Column>
          <UserIcon size="medium" />
        </Row>
        {transactionCompleted ? (
          token &&
          token.symbol === 'ICP' && (
            <Button
              variant="gray"
              text="View on Explorer"
              buttonStyle={styles.button}
              onPress={() =>
                Linking.openURL(
                  getICRocksTransactionUrl(transaction?.response.transactionId),
                )
              }
            />
          )
        ) : (
          <RainbowButton
            text="Hold to Send" // TODO: Check this title
            loading={loading}
            disabled={loading}
            onLongPress={onSend}
            buttonStyle={styles.button}
          />
        )}
      </View>
      <SaveContact modalRef={saveContactRef} id={to} />
    </Modal>
  );
};

export default ReviewSend;
