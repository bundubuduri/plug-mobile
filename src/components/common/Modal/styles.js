import { Colors } from '@/constants/theme';

const modalStyle = {
  zIndex: 5,
  marginTop: 'auto',
  backgroundColor: Colors.Black.Pure,
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
};

const flexStyle = { flex: 1 };

const overlayStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(21, 22, 28, 0.6)', //TODO: I think we should remove this, looks better without it
};

const handleStyle = {
  alignSelf: 'center',
  top: 10,
  width: 30,
  height: 5,
  borderRadius: 5,
  backgroundColor: Colors.Gray.Primary,
};

export default { flexStyle, modalStyle, overlayStyle, handleStyle };
