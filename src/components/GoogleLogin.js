import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { showSuccessToast } from "../utils/toast";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as WebBrowser from "expo-web-browser";
import { WEB_GOOGLE_CLIENT_ID, IOS_GOOGLE_CLIENT_ID } from "../core/config";
import { useNavigation } from "@react-navigation/native";
import userApi from "../api/UserApi";
import { useAuth } from "../common/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const GoogleLogin = ({ setLoading }) => {
  const navigation = useNavigation();
  const { setIsAuthenticated } = useAuth();

  useEffect(() => {
    console.log("🟢 useEffect → Configuring Google Signin...");
    try {
      GoogleSignin.configure({
        webClientId: WEB_GOOGLE_CLIENT_ID,
        iosClientId: IOS_GOOGLE_CLIENT_ID,
        offlineAccess: true,
        scopes: [
          "profile",
          "email",
          "https://www.googleapis.com/auth/user.birthday.read",
          "https://www.googleapis.com/auth/user.gender.read",
        ],
      });
      console.log("✅ Google Signin configured successfully");
    } catch (err) {
      console.log("❌ Error configuring Google Signin:", err);
    }
  }, []);

  const signIn = async () => {
    console.log("🟡 SignIn button pressed");
    setLoading(true);

    try {
      console.log("➡️ Calling userApi.userGoogleLogin()...");
      const response = await userApi.userGoogleLogin();
      console.log("✅ userApi.userGoogleLogin() completed:", response);

      if (response?.data?.success) {
        console.log("🎉 Login success → navigating to Home");
        setIsAuthenticated(true);
        navigation.navigate("Root", { screen: "Home" });
        showSuccessToast("Welcome Back");
      } else if (response?.data && !response.data.success) {
        console.log(
          "⚠️ Login partially successful → navigating to Preferences"
        );
        setIsAuthenticated(true);
        const screenType = "login";
        navigation.navigate("Root", {
          screen: "Preferences",
          params: { screenType },
        });
        showSuccessToast("Welcome Back");
      } else {
        console.log(
          "❌ Google login failed:",
          response?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.log("💥 Error caught in signIn():", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("🚫 User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("⏳ Sign in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("⚠️ Play services not available or outdated");
      } else {
        console.log(
          "🔥 Unhandled Google Sign-In error:",
          error.message || error
        );
      }
    } finally {
      console.log("🔚 SignIn function finished (finally block)");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        style={{ width: 250, height: 48 }}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={() => {
          console.log("🖱️ Google Sign-In button clicked");
          signIn();
        }}
      />
    </View>
  );
};

export default GoogleLogin;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
