import React from 'react';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const LightingActivityIcon = ({ color, ...props }) => (
  <Svg width="19" height="19" viewBox="0 0 19 19" {...props}>
    <Rect
      x="0.6"
      y="0.6"
      width="17.8"
      height="17.8"
      rx="8.9"
      fill="white"
      stroke="url(#paint0_linear_4235_1860)"
      stroke-width="1.2"
    />
    <Path
      d="M12.5566 10.0644L8.07422 13.9844C7.95118 14.0898 7.81055 14.125 7.6875 14.125C7.56446 14.125 7.44141 14.0898 7.35352 14.0195C7.14258 13.8789 7.05469 13.5977 7.16016 13.3516L8.51368 10.1875H6.5625C6.31641 10.1875 6.10547 10.0469 6.03516 9.83593C5.94727 9.60742 6 9.36132 6.17578 9.20312L10.6758 5.2832C10.8691 5.10742 11.1504 5.10742 11.3613 5.26562C11.5898 5.40625 11.6602 5.6875 11.5547 5.93359L10.2012 9.08007H12.1699C12.3984 9.08007 12.6094 9.23828 12.6973 9.44921C12.7852 9.66015 12.7324 9.90625 12.5566 10.0644Z"
      fill="url(#paint1_linear_4235_1860)"
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_4235_1860"
        x1="1.5"
        y1="2.5"
        x2="17"
        y2="16.5"
        gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFEF5E" />
        <Stop offset="1" stopColor="#FF9518" />
      </LinearGradient>
      <LinearGradient
        id="paint1_linear_4235_1860"
        x1="6.5"
        y1="6"
        x2="13"
        y2="14"
        gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFEA5A" />
        <Stop offset="1" stopColor="#FF9A1C" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export default LightingActivityIcon;
