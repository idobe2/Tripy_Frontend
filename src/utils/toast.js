import Toast from "react-native-toast-message";

export const showToast = (message, type = "success", position = "top") => {
  Toast.show({
    type: type, // 'success', 'error', 'info'
    text1: message,
    position: position, // 'top', 'bottom'
    visibilityTime: 3000,
    autoHide: true,
  });
};

export const showSuccessToast = (message, position = "top") => {
  showToast(message, "success", position);
};

export const showErrorToast = (message, position = "top") => {
  showToast(message, "error", position);
};

export const showInfoToast = (message, position = "top") => {
  showToast(message, "info", position);
};
