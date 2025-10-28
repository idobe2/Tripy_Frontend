import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import { Text, IconButton } from "react-native-paper";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import userApi from "../api/UserApi";
import { useAuth } from "../common/AuthContext";
import NetInfo from "@react-native-community/netinfo";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAuthenticated } = useAuth();

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onLoginPressed = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network connection and try again."
      );
      return;
    }

    try {
      setIsLoading(true);
      const response = await userApi.userLogin(email.value, password.value);
      if (response === null) {
        console.log("response is null");
        setIsLoading(false);
        return;
      }
      console.log("response from Api:", response);
      if (response.success) {
        setIsAuthenticated(true);
        navigation.navigate("Root", { screen: "Home" });
        console.log("User has authenticated");
        showSuccessToast("Welcome Back");
      } else {
        const targetScreen = response.tranferTo;
        setIsAuthenticated(true);
        console.log("targetScreen:", targetScreen);
        if (targetScreen === "Preferences") {
          setIsAuthenticated(true);
          const screenType = "login";
          navigation.navigate("Root", {
            screen: targetScreen,
            params: { screenType },
          });
        }
      }
    } catch (error) {
      console.log("Error:", error);
      showErrorToast("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Logo />
      <Header>Welcome back.</Header>
      <TextInput
        label="Email"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: "" })}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          label="Password"
          returnKeyType="done"
          value={password.value}
          onChangeText={(text) => setPassword({ value: text, error: "" })}
          secureTextEntry={!showPassword}
          style={[styles.input, { paddingRight: 40 }]}
        />
        <IconButton
          icon={showPassword ? "eye-off" : "eye"}
          onPress={handleTogglePasswordVisibility}
          style={[
            styles.iconButton,
            { position: "absolute", right: 10, bottom: 5 },
          ]}
        />
      </View>
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ResetPasswordScreen")}
          style={{ paddingTop: 10 }}
        >
          <Text style={styles.forgot}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Button mode="contained" onPress={onLoginPressed}>
          Login
        </Button>
      )}
      <View style={styles.row}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace("RegisterScreen")}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    height: 60,
  },
  iconButton: {
    margin: 0,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
});
