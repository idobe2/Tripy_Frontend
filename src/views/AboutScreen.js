import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import HomeBackground from "../components/HomeBackground";
import Header from "../components/Header";
import Paragraph from "../components/Paragraph";
import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";
import { theme } from "../core/theme";

const About = () => {
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);

  const handleTermsPress = () => {
    setIsTermsModalVisible(true);
  };

  const handlePrivacyPress = () => {
    setIsPrivacyModalVisible(true);
  };

  const handleEmailPress = () => {
    Linking.openURL("mailto:tripy@tech-center.com");
  };

  return (
    <HomeBackground>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.section}>
            <Header>Tripy</Header>
            <View style={styles.setting}>
              <Paragraph style={styles.settingText}>
                🌍 Tripy is your ultimate travel app, helping you plan,
                organize, and enjoy your trips effortlessly.{"\n\n"}From finding
                the best activities{"\n"}to keeping track of your travel plans,
                Tripy makes your travel experience seamless and enjoyable. ✈️🧳
              </Paragraph>
            </View>
          </View>

          <View style={styles.section}>
            <Header>Terms</Header>
            <TouchableOpacity
              style={styles.setting}
              onPress={handlePrivacyPress}
            >
              <MaterialIcons name="privacy-tip" size={24} color="black" />
              <Paragraph style={styles.settingsLink}>Privacy Policy</Paragraph>
            </TouchableOpacity>
            <TouchableOpacity style={styles.setting} onPress={handleTermsPress}>
              <MaterialIcons name="description" size={24} color="black" />
              <Paragraph style={styles.settingsLink}>
                Terms & Conditions
              </Paragraph>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Header>Talk to us</Header>
            <TouchableOpacity style={styles.setting} onPress={handleEmailPress}>
              <MaterialIcons name="email" size={24} color="black" />
              <Paragraph style={styles.settingsLink}>
                Tripy@tech-center.com
              </Paragraph>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <TermsModal
        visible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
      />
      <PrivacyModal
        visible={isPrivacyModalVisible}
        onClose={() => setIsPrivacyModalVisible(false)}
      />
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
  section: {
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#add8e6",
    borderRadius: 10,
  },
  setting: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 10,
  },
  settingsLink: {
    fontSize: 16,
    marginLeft: 10,
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },
});

export default About;
