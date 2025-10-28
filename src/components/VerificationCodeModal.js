import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
} from "react-native";
import { showSuccessToast } from "../utils/toast";
import Button from "../components/Button";
import { theme } from "../core/theme";
import userApi from "../api/UserApi";

const VerificationCodeModal = ({ visible, onClose, onConfirm, email }) => {
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef([]);

  const handleChangeText = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Move to the next input if the current one is filled
    if (text.length === 1 && index < 4) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace" && code[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleConfirm = () => {
    const verificationCode = code.join("");
    onConfirm(verificationCode);
    setCode(["", "", "", "", ""]);
    onClose();
  };

  const handleCancel = () => {
    setCode(["", "", "", "", ""]);
    onClose();
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.sendVerificationCode(email);
      if (response.success) {
        showSuccessToast("Verification code resent");
      } else {
        console.log("Failed to resend verification code:", response.error);
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Enter the code you received:</Text>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <RNTextInput
                key={index}
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={1}
                ref={(input) => (inputs.current[index] = input)}
              />
            ))}
          </View>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
          >
            Confirm
          </Button>
          <Button
            mode="contained"
            onPress={handleCancel}
            style={[styles.button, { backgroundColor: "red" }]}
          >
            Cancel
          </Button>
          <View style={styles.resendContainer}>
            <Text style={styles.text}>Didn't receive a code? </Text>
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: theme.colors.primary,
    width: 40,
    height: 40,
    textAlign: "center",
    fontSize: 20,
    marginHorizontal: 5,
  },
  button: {
    marginVertical: 10,
    width: "100%",
  },
  resendContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  text: {
    fontSize: 14,
    color: "#000",
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
});

export default VerificationCodeModal;
