import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
} from "react-native";
import { showSuccessToast } from "../utils/toast";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import { theme } from "../core/theme";
import userApi from "../api/UserApi";
import AnimatedLogo from "../common/AnimatedLogo";
import HomeBackground from "../components/HomeBackground";
import Paragraph from "../components/Paragraph";
import { useFocusEffect } from "@react-navigation/native";

const Preferences = ({ route, navigation }) => {
  const { screenType } = route.params;
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const preferences = await userApi.getUserPreferences();
        if (preferences) {
          setSelectedPreferences(preferences);
        }
      } catch (error) {
        console.log("Error fetching preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (screenType === "login") {
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [screenType])
  );

  const handlePreferencePress = (preference) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(
        selectedPreferences.filter((item) => item !== preference)
      );
    } else {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  const handleContinuePress = async () => {
    try {
      setIsLoading(true);
      await userApi.addUserPreferences(selectedPreferences);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Root", {
          screen: "Tripy",
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
      showSuccessToast("Preferences saved!");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <AnimatedLogo />
      </View>
    );
  }

  const preferenceIcons = {
    Beach: "sunny-outline",
    Mountains: "trail-sign-outline",
    City: "business-outline",
    Nature: "leaf-outline",
    History: "book-outline",
    Adventure: "airplane-outline",
    Relaxation: "bed-outline",
    "Food and Drinks": "restaurant-outline",
    Art: "color-palette-outline",
    Music: "musical-notes-outline",
    Shopping: "cart-outline",
    Sports: "football-outline",
    Technology: "laptop-outline",
    Wildlife: "paw-outline",
    Nightlife: "moon-outline",
    Wellness: "fitness-outline",
    Photography: "camera-outline",
    Theater: "film-outline",
    Literature: "bookmarks-outline",
  };

  return (
    <HomeBackground>
      <View style={styles.container}>
        <Paragraph style={{ marginTop: 20, bottom: 20 }}>
          To tailor the best trip for you,{"\n"}we'd love to know more about you
          😊{"\n"}What do you like?
        </Paragraph>
        <ScrollView style={styles.scrollView}>
          {[
            "Beach",
            "Mountains",
            "City",
            "Nature",
            "History",
            "Adventure",
            "Relaxation",
            "Food and Drinks",
            "Art",
            "Music",
            "Shopping",
            "Sports",
            "Technology",
            "Wildlife",
            "Nightlife",
            "Wellness",
            "Photography",
            "Theater",
            "Literature",
          ].map((preference, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                selectedPreferences.includes(preference) &&
                  styles.selectedButton,
              ]}
              onPress={() => handlePreferencePress(preference)}
            >
              <Ionicons
                name={preferenceIcons[preference]}
                size={24}
                color="white"
                style={styles.icon}
              />
              <Text style={styles.buttonText}>{preference}</Text>
              {selectedPreferences.includes(preference) && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="white"
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button
          mode="contained"
          style={styles.continueButton}
          onPress={handleContinuePress}
        >
          Save Preferences
        </Button>
      </View>
    </HomeBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    marginBottom: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#72bcd4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: "#add8e6",
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    flex: 1,
  },
  checkmark: {
    marginLeft: "auto",
  },
  continueButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
});

export default Preferences;
