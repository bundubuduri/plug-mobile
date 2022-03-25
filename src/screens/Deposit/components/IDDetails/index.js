import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import React, { useState, useEffect } from 'react';
import Clipboard from '@react-native-community/clipboard';

import InfoWithActions from '../../../../components/common/InfoWithActions';
import GradientText from '../../../../components/common/GradientText';
import CopiedToast from '../../../../components/common/CopiedToast';
import shortAddress from '../../../../helpers/short-address';
import Column from '../../../../components/layout/Column';
import { getIdInfo } from '../../constants';
import styles from './styles';

function IDDetails({ idType }) {
  const [visibility, setVisibility] = useState(false);
  const { currentWallet } = useSelector(state => state.keyring);
  const { principal, accountId } = currentWallet || {};
  const { description, id, colors } = getIdInfo(principal, accountId, idType);

  const handleOnPress = () => {
    Clipboard.setString(`${id}`);
    setVisibility(true);
  };

  useEffect(() => {
    return () => setVisibility(false);
  }, []);

  return (
    <Column style={styles.container}>
      <GradientText colors={colors} style={styles.title}>
        {idType}
      </GradientText>
      <Text style={styles.text}>{description}</Text>
      <InfoWithActions
        text={shortAddress(id, { leftSize: 10, rightSize: 15 })}
        actions={[{ icon: 'copy', onPress: handleOnPress }]}
        colors={colors}
      />
      <CopiedToast
        visibility={visibility}
        setVisibility={setVisibility}
        customStyle={styles.toastStyle}
        customPointerStyle={styles.toastPointerStyle}
      />
    </Column>
  );
}

export default IDDetails;