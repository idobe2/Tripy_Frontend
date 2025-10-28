import "react-native-get-random-values";
import React, { useEffect, useState, Platform } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NativeWindStyleSheet } from "nativewind";
import NetInfo from "@react-native-community/netinfo";
import { Alert } from "react-native";
import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
} from "./src/screens";
import { enableLatestRenderer } from "react-native-maps";
import HomeScreen from "./src/views/HomeScreen";
import SettingsScreen from "./src/views/SettingsScreen";
import PreferencesScreen from "./src/views/PreferencesScreen";
import LoadingScreen from "./src/common/LoadingScreen";
import { AuthProvider, useAuth } from "./src/common/AuthContext";
import clientApi from "./src/api/ClientApi";
import { PlansProvider } from "./src/common/PlansContext";
import AboutScreen from "./src/views/AboutScreen";
import Toast from "react-native-toast-message";

enableLatestRenderer();

const Stack = createStackNavigator();
const NewStack = createStackNavigator();

NativeWindStyleSheet.setOutput({
  default: "native",
});

function Root() {
  return (
    <NewStack.Navigator screenOptions={{ headerShown: false }}>
      <NewStack.Screen name="Tripy" component={HomeScreen} />
      <NewStack.Screen name="Settings" component={SettingsScreen} />
      <NewStack.Screen name="Preferences" component={PreferencesScreen} />
      <NewStack.Screen name="About" component={AboutScreen} />
    </NewStack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={Root} />
    </Stack.Navigator>
  );
}

function UnauthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StartScreen" component={StartScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen
        name="ResetPasswordScreen"
        component={ResetPasswordScreen}
      />
    </Stack.Navigator>
  );
}

function App() {
  const { loading, isAuthenticated, setIsAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(true);

  const checkAuthentication = async () => {
    try {
      const valid = await clientApi.get("/check");
      if (valid?.data.message === "Authenticated") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected !== isConnected) {
        setIsConnected(state.isConnected);
        if (state.isConnected) {
          Alert.alert("Back Online", "You are back online.");
          checkAuthentication();
        } else {
          Alert.alert(
            "No Network",
            "You are offline. Please connect to the network in order to return to the app .",
            [
              {
                text: "OK",
                onPress: () => {
                  setIsAuthenticated(false);
                },
              },
            ]
          );
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthStack /> : <UnauthStack />}
      <Toast />
    </NavigationContainer>
  );
}

export default () => (
  <PlansProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </PlansProvider>
);
