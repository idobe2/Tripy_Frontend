import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
} from "react-native";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import React from "react";
import Button from "../components/Button";
import userApi from "../api/UserApi";
import { theme } from "../core/theme";
import { useAuth } from "../common/AuthContext";
import DrawerContent from "../components/DrawerContent";
import HomeBackground from "../components/HomeBackground";
import ChangePasswordModal from "../components/ChangePasswordModal";
import VerificationCodeModal from "../components/VerificationCodeModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const Settings = ({ navigation }) => {
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [isChangePasswordLoading, setIsChangePasswordLoading] = useState(false);
  const [isResetCacheLoading, setIsResetCacheLoading] = useState(false);
  const { setIsAuthenticated } = useAuth();
  const [userType, setUserType] = useState("");
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
    useState(false);
  const [isVerificationCodeModalVisible, setIsVerificationCodeModalVisible] =
    useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const response = await userApi.getUserDetails();
        if (response) {
          setUserType(response.userType);
          setEmail(response.email);
        }
      } catch (error) {
        console.error("Error fetching user type:", error);
      }
    };
    fetchUserType();
  }, []);

  const handleLogout = async () => {
    console.log("Logout Button Pressed");
    try {
      setIsLogoutLoading(true);
      await userApi.check();
      const response = await userApi.userLogout();
      if (response === "logout successful") {
        setIsAuthenticated(false);
      }
      handleResetCache();
      showSuccessToast("Goodbye 👋, See you again soon 😊");
    } catch (err) {
      console.log("Logout failed " + err);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirm Account Deletion",
      "Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Verification Code",
          onPress: () => handleSendVerificationCode(),
        },
      ]
    );
  };

  const handleSendVerificationCode = async () => {
    setIsDeleteAccountLoading(true);
    try {
      const response = await userApi.sendVerificationCode(email);
      console.log("response: ", response);
      if (response === "Verification email sent") {
        showSuccessToast("Verification code sent");
        setIsVerificationCodeModalVisible(true);
      } else {
        console.log("Failed to send verification code:", response.error);
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
    } finally {
      setIsDeleteAccountLoading(false);
    }
  };

  const handleChangePassword = () => {
    setIsChangePasswordModalVisible(true);
  };

  const handleConfirmVerificationCode = async (verificationCode) => {
    setIsDeleteAccountLoading(true);
    try {
      const response = await userApi.verifyAndDeleteAccount(verificationCode);
      if (
        response ===
        "User data, plans, preferences, and authentication deleted successfully"
      ) {
        console.log("Account deleted successfully");
        showSuccessToast("Account deleted successfully");
        setIsAuthenticated(false);
      } else {
        Alert.alert("The code you entered is incorrect. Please try again.");
        console.log("Account deletion failed:", response.error);
      }
    } catch (error) {
      console.log("Error deleting account:", error);
    } finally {
      setIsDeleteAccountLoading(false);
      setIsVerificationCodeModalVisible(false);
    }
  };

  const handleConfirmChangePassword = async (currentPassword, newPassword) => {
    console.log("Changing password...");
    setIsChangePasswordLoading(true);
    try {
      const response = await userApi.userChangePassword(
        currentPassword,
        newPassword
      );
      if (response.success) {
        console.log("Password changed successfully");
        showSuccessToast("Password changed successfully");
      } else {
        console.log("Password change failed:", response.error);
      }
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsChangePasswordLoading(false);
    }
  };

  const handleSupportPress = () => {
    const subject = "Support Request";
    const body =
      "Hello,\n\nI need help with the Tripy app. Here are the details of my issue:\n\n[Describe your issue here]\n\nThank you,\n[Your Name]";
    const mailto = `mailto:tripy@tech-center.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto);
  };

  const handleResetCache = async () => {
    setIsResetCacheLoading(true);
    try {
      await AsyncStorage.clear();
      showSuccessToast("Cache has been reset");
    } catch (error) {
      console.error("Error resetting cache:", error);
      showErrorToast("Failed to reset cache");
    } finally {
      setIsResetCacheLoading(false);
    }
  };

  return (
    <HomeBackground>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.sectionProfile}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.setting}>
              <DrawerContent></DrawerContent>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            {userType === "local" && (
              <View style={styles.setting}>
                {isChangePasswordLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <Button
                    mode="outlined"
                    icon={() => (
                      <Icon name="lock-reset" size={25} color="#6d11ef" />
                    )}
                    onPress={handleChangePassword}
                    style={styles.roundedButton}
                  >
                    Change Password
                  </Button>
                )}
              </View>
            )}
            <View style={styles.setting}>
              {isDeleteAccountLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Button
                  mode="outlined"
                  icon={() => (
                    <Icon
                      name="delete-forever"
                      size={25}
                      color="#6d11ef"
                      style={{ right: 10 }}
                    />
                  )}
                  onPress={handleDeleteAccount}
                  style={styles.roundedButton}
                >
                  Delete Account
                </Button>
              )}
            </View>
          </View>
          {isLogoutLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.button}
            >
              Logout
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={handleSupportPress}
            style={styles.button}
          >
            Support
          </Button>
          {isResetCacheLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Button
              mode="outlined"
              onPress={handleResetCache}
              style={styles.button}
            >
              Reset Cache
            </Button>
          )}
        </View>
        <ChangePasswordModal
          visible={isChangePasswordModalVisible}
          onClose={() => setIsChangePasswordModalVisible(false)}
          onConfirm={handleConfirmChangePassword}
        />
        <VerificationCodeModal
          visible={isVerificationCodeModalVisible}
          onClose={() => setIsVerificationCodeModalVisible(false)}
          onConfirm={handleConfirmVerificationCode}
          email={email}
        />
      </ScrollView>
    </HomeBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  section: {
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#add8e6",
    borderRadius: 10,
  },
  sectionProfile: {
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#add8e6",
    borderRadius: 10,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
  },
  button: {
    marginVertical: 10,
  },
  verifyButton: {
    width: "60%",
    backgroundColor: "#FFD580",
  },
  roundedButton: {
    width: "100%",
    borderRadius: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    opacity: 0.95,
  },
});

export default Settings;
