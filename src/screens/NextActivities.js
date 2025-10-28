import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { showErrorToast } from "../utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import placesApi from "../api/PlacesApi";
import plansApi from "../api/PlanApi";
import HomeBackground from "../components/HomeBackground";
import { format, parse } from "date-fns";
import { API_KEY } from "../core/config";
import RatingStars from "../components/RatingStars";
import Header from "../components/Header";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import { PlansContext } from "../common/PlansContext";
import NoPlansMessage from "../components/NoPlansMessage";
import BackButton from "../components/BackButton";

const NextActivities = ({ navigation }) => {
  const { plansChanged, setPlansChanged } = useContext(PlansContext);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [apiError, setApiError] = useState(false);

  const fetchNextActivities = useCallback(async () => {
    setLoading(true);
    console.log("Fetching next activities...");

    try {
      // Invalidate the cache if plans have changed
      if (plansChanged) {
        console.log("Invalidating cache due to plan changes");
        await AsyncStorage.removeItem("nextActivities");
        setPlansChanged(false);
      }

      // Try to get cached plans
      let cachedPlans = [];
      try {
        const cachedData = await AsyncStorage.getItem("nextActivities");
        if (cachedData !== null) {
          cachedPlans = JSON.parse(cachedData);
        } else {
          console.log("No cached data found");
        }
      } catch (error) {
        console.error("Failed to load cached plans:", error);
      }

      if (
        cachedPlans &&
        cachedPlans.activities &&
        cachedPlans.activities.length > 0
      ) {
        console.log("Using cached data");
        setActivities(cachedPlans.activities);
        setCity(cachedPlans.city);
        setDate(cachedPlans.date);
        setCurrentPlan(cachedPlans.currentPlan);
        setLoading(false);
        return;
      }

      // Fetch plans from API
      console.log("Fetching new data from API");
      const fetchedPlans = await plansApi.fetchPlans();
      if (fetchedPlans && fetchedPlans.length > 0) {
        const now = new Date();
        // Resetting time part for comparison
        now.setHours(0, 0, 0, 0);
        let nextActivities = [];
        for (const plan of fetchedPlans) {
          for (const day of plan.travelPlan) {
            const activitiesToday = day.activities.map((activity) => ({
              activityId: activity,
              day: day.day,
              destination: plan.destination,
              plan: plan,
            }));
            const activityDate = parse(day.day, "dd/MM/yy", new Date());
            // Resetting time part for comparison
            activityDate.setHours(0, 0, 0, 0);
            if (activityDate >= now) {
              nextActivities = [...nextActivities, ...activitiesToday];
            }
          }
        }
        nextActivities.sort(
          (a, b) =>
            parse(a.day, "dd/MM/yy", new Date()).getTime() -
            parse(b.day, "dd/MM/yy", new Date()).getTime()
        );
        const closestDay = nextActivities.length ? nextActivities[0].day : null;
        if (closestDay) {
          const filteredActivities = nextActivities.filter(
            (activity) => activity.day === closestDay
          );
          const detailedActivities = await Promise.all(
            filteredActivities.map(async (activity) => {
              try {
                const details = await placesApi.getPlaceDetails(
                  activity.activityId
                );
                return { ...activity, ...details };
              } catch (error) {
                console.error("Error fetching place details:", error);
                return { ...activity, error: true };
              }
            })
          );
          const validDetailedActivities = detailedActivities.filter(
            (activity) => !activity.error
          );
          if (validDetailedActivities.length > 0) {
            setCity(validDetailedActivities[0].destination);
            setDate(
              format(
                parse(validDetailedActivities[0].day, "dd/MM/yy", new Date()),
                "MMMM dd, yyyy"
              )
            );
            setCurrentPlan(validDetailedActivities[0].plan);

            // Cache the activities
            try {
              await AsyncStorage.setItem(
                "nextActivities",
                JSON.stringify({
                  activities: validDetailedActivities,
                  city: validDetailedActivities[0].destination,
                  date: format(
                    parse(
                      validDetailedActivities[0].day,
                      "dd/MM/yy",
                      new Date()
                    ),
                    "MMMM dd, yyyy"
                  ),
                  currentPlan: validDetailedActivities[0].plan,
                })
              );
              console.log("Data cached successfully");
            } catch (error) {
              console.error("Failed to save activities to cache:", error);
            }
          }
          setActivities(validDetailedActivities);
        }
      } else {
        setApiError(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setApiError(true);
      }
      showErrorToast("Failed to fetch activities");
      console.error("Error fetching next activities:", error);
    }
    setLoading(false);
  }, [plansChanged, setPlansChanged]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchNextActivities);
    return unsubscribe;
  }, [navigation, fetchNextActivities]);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={{ flex: 1 }}>
        <Header style={styles.placeName}>
          {truncateText(item.name, 25) || "Unknown Activity"}
        </Header>
        <RatingStars rating={item.rank} />
        <Paragraph style={styles.placeAddress}>
          {item.address || "Unknown Address"}
        </Paragraph>
      </View>
      {item.photo_reference && (
        <Image
          source={{
            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photo_reference}&key=${API_KEY}`,
          }}
          style={styles.activityImage}
        />
      )}
    </View>
  );

  const openGoogleMapsRoute = () => {
    if (activities.length === 0) {
      showErrorToast("No activities to show in Google Maps");
      return;
    }
    const baseUrl = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
    const origin = `&origin=${encodeURIComponent(
      activities[0].name + ", " + activities[0].address
    )}`;
    const waypoints = activities
      .slice(1)
      .map((activity) =>
        encodeURIComponent(activity.name + ", " + activity.address)
      )
      .join("|");
    const destination = `&destination=${encodeURIComponent(
      activities[activities.length - 1].name +
        ", " +
        activities[activities.length - 1].address
    )}`;
    const waypointsParam = waypoints ? `&waypoints=${waypoints}` : "";
    const url = baseUrl + origin + destination + waypointsParam;
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred while opening Google Maps", err)
    );
  };

  const handleOpenGoogleMaps = () => {
    Alert.alert(
      "Open Google Maps",
      "Do you want to open the activities route in Google Maps?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: openGoogleMapsRoute,
        },
      ]
    );
  };

  const truncateText = (text, length) => {
    if (text.length > length) {
      return text.substring(0, length) + "...";
    }
    return text;
  };

  return (
    <HomeBackground>
      <BackButton goBack={navigation.goBack} />
      <View style={styles.container}>
        <Header style={styles.city}>{city}</Header>
        <Paragraph style={styles.date}>{date}</Paragraph>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            {activities.length > 0 ? (
              <FlatList
                data={activities}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
              />
            ) : (
              <NoPlansMessage
                onGetStarted={() => navigation.navigate("Welcome")}
              />
            )}
            {currentPlan && (
              <View style={styles.buttonsContainer}>
                <Button
                  mode="contained"
                  onPress={() =>
                    navigation.navigate("PlanDetails", {
                      trip: currentPlan,
                      image: null,
                    })
                  }
                >
                  View Plan Details
                </Button>
                <Button mode="outlined" onPress={handleOpenGoogleMaps}>
                  Open in Google Maps
                </Button>
              </View>
            )}
          </>
        )}
      </View>
    </HomeBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  city: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  date: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#add8e6",
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeAddress: {
    marginTop: 5,
    marginRight: 5,
  },
  activityImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  buttonsContainer: {
    marginTop: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NextActivities;
