import React, { useEffect } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Tokens from '../../screens/Wallet/tabs/Tokens';
import NFTs from '../../screens/Wallet/tabs/NFTs';
import ProfileScreen from '../../screens/Profile';
import BottomTabs from './BottomTabs';
import Routes from '../Routes';
import useDeepLink from '../../hooks/useDeepLink';
import { useNavigation } from '@react-navigation/native';

const Swipe = createMaterialTopTabNavigator();

const SwipeNavigator = () => {
  const { deepLink } = useDeepLink();
  const navigation = useNavigation();

  useEffect(() => {
    alert(`'SWIPE NAVIGATOR' ${deepLink}`);
    if (deepLink) navigation.navigate(Routes.WALLET_CONNECT);
  }, [deepLink]);

  return (
    <Swipe.Navigator
      screenOptions={{
        tabBarBounces: false,
      }}
      initialRouteName={Routes.TOKENS}
      tabBarPosition="bottom"
      tabBar={props => <BottomTabs {...props} />}>
      <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} />
      <Swipe.Screen component={Tokens} name={Routes.TOKENS} />
      <Swipe.Screen component={NFTs} name={Routes.NFTS} />
    </Swipe.Navigator>
  );
};

export default SwipeNavigator;
