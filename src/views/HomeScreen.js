import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../common/AuthContext";
import Planner from "./PlannerScreen";
import HomeStack from "./HomeStack";
import HomeBackground from "../components/HomeBackground";
import clientApi from "../api/ClientApi";

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {
  const { setIsAuthenticated } = useAuth();
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
            "You are offline. Please connect to the network in order to return to the app.",
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

  return (
    <HomeBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -64}
      >
        <NavigationContainer independent={true}>
          <Tab.Navigator
            screenOptions={{
              activeTintColor: "blue",
              inactiveTintColor: "gray",
            }}
          >
            <Tab.Screen
              name="Home"
              component={HomeStack.Explore}
              options={{
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home-outline" color={color} size={size} />
                ),
              }}
            />
            <Tab.Screen
              name="Planner"
              component={Planner}
              options={{
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="map" color={color} size={size} />
                ),
              }}
            />
            <Tab.Screen
              name="Previous Plans"
              component={HomeStack.Trip}
              options={{
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                  <Ionicons
                    name="briefcase-outline"
                    color={color}
                    size={size}
                  />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </KeyboardAvoidingView>
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginBottom: -38,
  },
});
