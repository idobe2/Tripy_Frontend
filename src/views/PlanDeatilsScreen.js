import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import Icon from "react-native-vector-icons/MaterialIcons";
import RNCalendarEvents from "react-native-calendar-events";
import { Menu, Provider } from "react-native-paper";
import placesApi from "../api/PlacesApi";
import { API_KEY } from "../core/config";
import ActivityActions from "../components/ActivityActions";
import ActivityBottomSheet from "../components/ActivityBottomSheet";
import PlanApi from "../api/PlanApi";
import RatingStars from "../components/RatingStars";
import AnimatedLogo from "../common/AnimatedLogo";
import HomeBackground from "../components/HomeBackground";
import BackButton from "../components/BackButton";
import MealTypeModal from "../components/MealTypeModal";
import { Swipeable } from "react-native-gesture-handler";
import { PlansContext } from "../common/PlansContext"; // Import context

export default function PlanDetailsScreen({ route, navigation }) {
  const { trip, image } = route.params;
  const [activitiesDetails, setActivitiesDetails] = useState([]);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [additionalActivitiesDetails, setAdditionalActivitiesDetails] =
    useState([]);
  const [loading, setLoading] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [mealDetails, setMealDetails] = useState({});
  const [caller, setCaller] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const { setPlansChanged } = useContext(PlansContext);
  const swipeableRefs = useRef(new Map()); // Add a reference to store swipeable components

  useEffect(() => {
    fetchActivitiesDetails();
    requestCalendarPermissions();
  }, [trip]);

  const requestCalendarPermissions = async () => {
    try {
      const status = await RNCalendarEvents.requestPermissions();
      if (status === "authorized") {
        fetchCalendars();
      } else {
        showErrorToast("Calendar permission is required to add events");
      }
    } catch (error) {
      console.error("Error requesting calendar permissions: ", error);
    }
  };

  //show only emails accounts
  const fetchCalendars = async () => {
    try {
      const calendars = await RNCalendarEvents.findCalendars();

      // Filter calendars that are primary
      const emailCalendars = calendars.filter(
        (calendar) => calendar.isPrimary === true
      );

      setCalendars(emailCalendars);
      setItems(
        emailCalendars.map((calendar) => ({
          label: calendar.title,
          value: calendar.id,
        }))
      );

      // Check if there is a previously selected calendar
      const previouslySelectedCalendar = emailCalendars.find(
        (calendar) => calendar.id === selectedCalendar?.id
      );

      if (previouslySelectedCalendar) {
        setSelectedCalendar(previouslySelectedCalendar);
      } else if (emailCalendars.length > 0) {
        setSelectedCalendar(emailCalendars[0]);
      }
    } catch (error) {
      console.error("Error fetching calendars: ", error);
    }
  };

  const fetchActivitiesDetails = async () => {
    setLoading(true);
    try {
      const details = await Promise.all(
        trip?.travelPlan?.flatMap((day) =>
          day.activities.map((activity) => placesApi.getPlaceDetails(activity))
        ) || []
      );
      setActivitiesDetails(details);
    } catch (error) {
      console.error("Error fetching activity details:", error);
    }
    setLoading(false);
  };

  const handleEdit = (activity, activityIndex, dayIndex) => {
    setCaller("edit");
    Alert.alert(
      "Generate",
      "Do you want to generate new activities?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            setLoading(true);
            console.log("Generate activity:", activity);
            const response = await PlanApi.generateActivities(
              trip.planId,
              dayIndex,
              activityIndex
            );
            console.log("Response:", response);

            const additionalDetails = await Promise.all(
              response.additionalActivities.map((placeId) =>
                placesApi.getPlaceDetails(placeId)
              )
            );
            setBottomSheetVisible(true);
            setAdditionalActivitiesDetails(additionalDetails);
            setSelectedActivity({
              ...activity,
              activityIndex,
              dayIndex,
              tripId: trip.planId,
            });
            setLoading(false);
            setBottomSheetVisible(true);
            setPlansChanged(true);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = (activity, activityIndex, dayIndex) => {
    Alert.alert(
      "Delete",
      "Do you want to delete this activity?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            setLoading(true);
            console.log("Delete activity:", activity);
            try {
              const response = await PlanApi.deleteActivity(
                trip.planId,
                dayIndex,
                activityIndex
              );
              console.log("Response:", response);

              // Update the trip.travelPlan to remove the activity
              const updatedTravelPlan = [...trip.travelPlan];
              updatedTravelPlan[dayIndex].activities.splice(activityIndex, 1);

              // Remove the day if it has no activities
              if (updatedTravelPlan[dayIndex].activities.length === 0) {
                updatedTravelPlan.splice(dayIndex, 1);
                setActivitiesDetails(
                  activitiesDetails.filter(
                    (detail) => detail.place_id !== activity.place_id
                  )
                );
              }

              // Rebuild the activitiesDetails array based on updated travelPlan
              const newActivitiesDetails = [];
              for (const day of updatedTravelPlan) {
                for (const activityId of day.activities) {
                  const detail = activitiesDetails.find(
                    (detail) => detail.place_id === activityId
                  );
                  if (detail) {
                    newActivitiesDetails.push(detail);
                  }
                }
              }

              // Set the new state
              setActivitiesDetails(newActivitiesDetails);

              // Also update the trip object itself if needed elsewhere
              trip.travelPlan = updatedTravelPlan;

              const swipeableRow = swipeableRefs.current.get(
                `${dayIndex}-${activityIndex}`
              );
              if (swipeableRow) {
                swipeableRow.close();
              }

              // Show a success toast
              showSuccessToast("Activity deleted successfully");
              // console.log("Activities Details:", newActivitiesDetails);
              // console.log("Updated Travel Plan:", updatedTravelPlan);
            } catch (error) {
              console.error("Error deleting activity:", error);
              showErrorToast("Failed to delete activity");
            }
            setLoading(false);
            setPlansChanged(true);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMeal = (activity, activityIndex, dayIndex) => {
    setCaller("meal");
    setMealDetails({ activity, activityIndex, dayIndex });
    setMealModalVisible(true);
  };

  const onMealSelect = async (mealType) => {
    setLoading(true);
    setMealModalVisible(false);
    const { activity, activityIndex, dayIndex } = mealDetails;
    console.log("Add meal to activity:", activity, "Meal Type:", mealType);
    const response = await PlanApi.generateMeals(
      trip.planId,
      dayIndex,
      activityIndex,
      mealType
    );

    const additionalDetails = await Promise.all(
      response.map((place) => placesApi.getPlaceDetails(place.placeId))
    );
    setBottomSheetVisible(true);
    setAdditionalActivitiesDetails(additionalDetails);
    setSelectedActivity({
      ...activity,
      activityIndex,
      dayIndex,
      tripId: trip.planId,
    });
    setLoading(false);
    setBottomSheetVisible(true);
  };

  const handleLinking = async (place) => {
    Alert.alert(
      `${place.name}`,
      "Do you want to open this place in Google Maps?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => await placesApi.openInGoogleMaps(place),
        },
      ],
      { cancelable: true }
    );
  };

  const fixedDate = (date) => {
    let [day, month, year] = date.split("/");
    if (year.length === 2) year = `20${year}`;
    else if (year.length === 4) year = `${year}`;
    else if (year.length === 3) year = `2${year}`;
    else if (year.length === 1) year = `200${year}`;
    const newDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = newDate.toLocaleDateString("en-US", options);
    return formattedDate;
  };

  const handleCalendar = async (item, index, dayIndex, calendarId) => {
    let startHour, endHour;
    if (index === 0) {
      startHour = "10:00";
      endHour = "12:00";
    } else if (index === 1) {
      startHour = "12:00";
      endHour = "14:00";
    } else if (index === 2) {
      startHour = "14:00";
      endHour = "16:00";
    } else {
      startHour = "16:00";
      endHour = "18:00";
    }

    const [day, month, year] = trip.travelPlan[dayIndex].day.split("/");
    const startDate = new Date(
      `20${year}-${month}-${day}T${startHour}:00.000Z`
    );
    const endDate = new Date(`20${year}-${month}-${day}T${endHour}:00.000Z`);

    try {
      console.log(`Attempting to add event: ${item.name}`);
      console.log(`Start Date: ${startDate.toISOString()}`);
      console.log(`End Date: ${endDate.toISOString()}`);
      const eventId = await RNCalendarEvents.saveEvent(item.name, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: item.address,
        notes: `Activity: ${item.name}\nAddress: ${item.address}`,
        calendarId: calendarId, // Specify the calendar ID here
      });
      console.log(`Event added with ID: ${eventId}`);
      return eventId;
    } catch (error) {
      console.error(`Error creating event for ${item.name}: `, error);
      return null;
    }
  };

  const addAllActivitiesToCalendar = async () => {
    if (!selectedCalendar) {
      showErrorToast("No Calendar Selected, Please select a calendar first.");
      return;
    }

    try {
      const status = await RNCalendarEvents.requestPermissions();
      console.log(`Calendar permission status: ${status}`);
      if (status === "authorized") {
        const promises = [];
        for (let dayIndex = 0; dayIndex < trip.travelPlan.length; dayIndex++) {
          const day = trip.travelPlan[dayIndex];
          for (
            let activityIndex = 0;
            activityIndex < day.activities.length;
            activityIndex++
          ) {
            const activity =
              activitiesDetails[
                trip.travelPlan
                  .slice(0, dayIndex)
                  .reduce((sum, day) => sum + day.activities.length, 0) +
                  activityIndex
              ];
            promises.push(
              handleCalendar(
                activity,
                activityIndex,
                dayIndex,
                selectedCalendar.id
              )
            );
          }
        }
        const results = await Promise.all(promises);
        const successfulEvents = results.filter(
          (result) => result !== null
        ).length;
        showSuccessToast(
          `${successfulEvents} activities have been added to your calendar`
        );
      } else {
        showErrorToast("Calendar permission is required to add events");
      }
    } catch (error) {
      console.error("Error adding all activities to calendar: ", error);
      showErrorToast(
        "An error occurred while adding activities to the calendar"
      );
    }
  };

  const truncateText = (text, length) => {
    if (text.length > length) {
      return text.substring(0, length) + "...";
    }
    return text;
  };

  const renderRightActions = (progress, dragX, item, index, dayIndex) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item, index, dayIndex)}
      >
        <Icon name="delete" size={30} color="#fff" />
      </TouchableOpacity>
    );
  };

  const renderActivity = ({ item, index, dayIndex }) => (
    <Swipeable
      ref={(ref) => swipeableRefs.current.set(`${dayIndex}-${index}`, ref)} // Store reference
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item, index, dayIndex)
      }
    >
      <TouchableOpacity
        onPress={() => handleLinking(item)}
        style={styles.activityContainer}
      >
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>
            {truncateText(item.name, 19)}
          </Text>
          <ActivityActions
            onEdit={() => handleEdit(item, index, dayIndex)}
            onMeal={() => handleMeal(item, index, dayIndex)}
            onDelete={() => handleDelete(item, index, dayIndex)}
            onCalendar={() =>
              handleCalendar(item, index, dayIndex, selectedCalendar?.id)
            }
          />
        </View>
        <Text style={styles.activityText}>{item.address}</Text>
        <RatingStars rating={item.rank} />
        {item.photo_reference && (
          <Image
            source={{
              uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photo_reference}&key=${API_KEY}`,
            }}
            style={styles.activityImage}
          />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  const renderDay = ({ item, index }) => {
    const dayActivities = activitiesDetails.slice(
      trip.travelPlan
        .slice(0, index)
        .reduce((sum, day) => sum + day.activities.length, 0),
      trip.travelPlan
        .slice(0, index + 1)
        .reduce((sum, day) => sum + day.activities.length, 0)
    );

    return (
      <View>
        <Text style={styles.dayTitle}>{fixedDate(item.day)}</Text>
        <FlatList
          data={dayActivities}
          renderItem={(props) => renderActivity({ ...props, dayIndex: index })}
          keyExtractor={(activity, index) => index.toString()}
        />
      </View>
    );
  };

  const travelPlanWithIndices = trip.travelPlan.map((day, index) => ({
    ...day,
    startIndex: index * day.activities.length,
    endIndex: (index + 1) * day.activities.length - 1,
  }));

  const handleSelectActivity = async (
    newActivity,
    activityIndex,
    dayIndex,
    planId,
    activityName
  ) => {
    console.log("Caller:", caller);
    console.log("Selected Activity:", {
      planId: planId,
      dayIndex: dayIndex,
      activityIndex: activityIndex,
      newActivity: newActivity,
      activityName: activityName,
    });
    if (caller === "edit") {
      const response = await PlanApi.replaceActivity(
        planId,
        dayIndex,
        activityIndex,
        newActivity
      );
      console.log("Replace Activity Response:", response);
      trip.travelPlan[dayIndex].activities[activityIndex] = newActivity;
    } else if (caller === "meal") {
      const response = await PlanApi.addMeal(
        planId,
        dayIndex,
        activityIndex,
        activityName,
        newActivity
      );
      console.log("Add Meal Response:", response);
      trip.travelPlan[dayIndex].activities.splice(
        activityIndex + 1,
        0,
        newActivity
      );
    }
    await fetchActivitiesDetails();
    setBottomSheetVisible(false);
    setPlansChanged(true);
  };

  return (
    <Provider>
      <HomeBackground>
        <BackButton goBack={navigation.goBack} />
        <View style={styles.container}>
          <View style={styles.header}>
            {image && (
              <Image source={{ uri: image }} style={styles.destinationImage} />
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{trip.destination}</Text>
              <Text style={styles.subtitle}>{trip.social}</Text>
              <Text style={styles.date}>
                {trip.arrivalDate} to {trip.departureDate}
              </Text>
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <Icon name="calendar-today" size={30} color="#000" />
                </TouchableOpacity>
              }
            >
              <Menu.Item title="Select a Calendar" disabled={true} />
              {items.map((item) => (
                <Menu.Item
                  key={item.value}
                  onPress={() => {
                    if (
                      selectedCalendar &&
                      selectedCalendar.id === item.value
                    ) {
                      addAllActivitiesToCalendar();
                    } else {
                      setValue(item.value);
                      setSelectedCalendar(
                        calendars.find((calendar) => calendar.id === item.value)
                      );
                      addAllActivitiesToCalendar();
                    }
                    setMenuVisible(false);
                  }}
                  title={item.label}
                  style={
                    selectedCalendar && selectedCalendar.id === item.value
                      ? styles.selectedCalendarItem
                      : null
                  }
                />
              ))}
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                }}
                title="Cancel"
              />
            </Menu>
          </View>
          <FlatList
            data={travelPlanWithIndices}
            renderItem={renderDay}
            keyExtractor={(day, index) => index.toString()}
          />
          <ActivityBottomSheet
            visible={bottomSheetVisible}
            onClose={() => setBottomSheetVisible(false)}
            activity={selectedActivity}
            additionalActivities={additionalActivitiesDetails}
            onSelect={handleSelectActivity}
            caller={caller}
          />
        </View>
        <MealTypeModal
          visible={mealModalVisible}
          onClose={() => setMealModalVisible(false)}
          onSelect={onMealSelect}
        />
      </HomeBackground>
      {loading && (
        <View style={styles.loadingOverlay}>
          <AnimatedLogo />
        </View>
      )}
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: "grey",
  },
  destinationImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  activityContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#E6E6FA",
    borderRadius: 5,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  activityText: {
    fontSize: 12,
  },
  activityImage: {
    width: "100%",
    height: 100,
    borderRadius: 5,
    marginTop: 10,
  },
  calendarButton: {
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  dropdown: {
    marginBottom: 20,
    width: "100%",
  },
  dropdownContainer: {
    width: "100%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  calendarContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%",
    alignItems: "center",
  },
  selectedCalendarContainer: {
    backgroundColor: "#f0f8ff",
  },
  calendarTitle: {
    fontSize: 18,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent background
    zIndex: 1,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    backgroundColor: "red",
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedCalendarItem: {
    backgroundColor: "#e0e0e0", // Highlight the selected item
  },
});
