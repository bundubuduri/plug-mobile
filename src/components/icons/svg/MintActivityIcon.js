import React from 'react';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const MintActivityIcon = ({ color = '#6B7280', ...props }) => (
  <Svg width="19" height="19" viewBox="0 0 19 19" {...props}>
    <Rect
      x="0.6"
      y="0.6"
      width="17.8"
      height="17.8"
      rx="8.9"
      fill="white"
      stroke="url(#paint0_linear_4235_1845)"
      stroke-width="1.2"
    />
    <Path
      d="M6.125 6.8125H5C5 8.97461 6.75781 10.75 8.9375 10.75V13C8.9375 13.3164 9.18359 13.5625 9.48242 13.5625C9.76367 13.5625 10.0625 13.3164 10.0625 13V10.75C10.0625 8.58789 8.28711 6.8125 6.125 6.8125ZM12.875 5.6875C11.3809 5.6875 10.0977 6.51367 9.42969 7.72656C9.9043 8.25391 10.2734 8.9043 10.4668 9.60742C12.4531 9.41406 14 7.72656 14 5.6875H12.875Z"
      fill="url(#paint1_linear_4235_1845)"
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_4235_1845"
        x1="1.15854"
        y1="3.0122"
        x2="15.2927"
        y2="17.378"
        gradientUnits="userSpaceOnUse">
        <Stop stopColor="#00E8FF" />
        <Stop offset="1" stopColor="#47F648" />
      </LinearGradient>
      <LinearGradient
        id="paint1_linear_4235_1845"
        x1="5.94737"
        y1="5.94737"
        x2="11.3947"
        y2="12.1053"
        gradientUnits="userSpaceOnUse">
        <Stop stopColor="#05E9F5" />
        <Stop offset="1" stopColor="#46F64C" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export default MintActivityIcon;
