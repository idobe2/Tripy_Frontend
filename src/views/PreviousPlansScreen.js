import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Paragraph from "../components/Paragraph";
import placesApi from "../api/PlacesApi";
import plansApi from "../api/PlanApi";
import { format, isSameYear } from "date-fns";
import DropDownPicker from "react-native-dropdown-picker";
import { Swipeable } from "react-native-gesture-handler";
import AnimatedLogo from "../common/AnimatedLogo";
import HomeBackground from "../components/HomeBackground";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlansContext } from "../common/PlansContext";
import NoPlansMessage from "../components/NoPlansMessage";

export default function PreviousPlans({ navigation }) {
  const { plansChanged, setPlansChanged } = useContext(PlansContext);

  const [destinationImages, setDestinationImages] = useState({});
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Sort by Date", value: "date" },
    { label: "Sort by Destination", value: "destination" },
    { label: "Sort by Social", value: "social" },
  ]);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [apiError, setApiError] = useState(false);

  const fetchData = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setApiError(false);

    try {
      const fetchedPlans = await plansApi.fetchPlans();
      if (!fetchedPlans) {
        setPlans([]);
      } else if (fetchedPlans.length > 0) {
        const plansWithId = fetchedPlans.map((plan, index) => ({
          ...plan,
          id: plan.id || index.toString(),
        }));
        setPlans(plansWithId);
        setFilteredPlans(plansWithId);
        const destination = await placesApi.fetchImages(plansWithId);
        if (destination) {
          setDestinationImages(destination);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setApiError(true);
      }
      showErrorToast("Failed to fetch plans");
      console.error("Error fetching plans:", error);
    }
    setLoading(false);
    setHasFetchedData(true);
  }, [loading]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      console.log("Plans changed:", plansChanged);
      if (!hasFetchedData) {
        fetchData();
      } else if (plansChanged) {
        setPlansChanged(false);
        fetchData();
      }
    });
    return () => unsubscribe();
  }, [navigation, fetchData, hasFetchedData, plansChanged, setPlansChanged]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, sortOption, plans]);

  useEffect(() => {
    let timeout;
    if (loading) {
      timeout = setTimeout(() => {
        if (loading) {
          showErrorToast("Server is taking too long to respond");
          setLoading(false);
        }
      }, 20000);
    }
    return () => clearTimeout(timeout);
  }, [loading]);

  const applyFilters = useCallback(() => {
    let updatedPlans = [...plans];
    // Apply search filter
    if (searchQuery) {
      updatedPlans = updatedPlans.filter((plan) =>
        plan.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Apply sorting
    switch (sortOption) {
      case "date":
        updatedPlans.sort(
          (a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate)
        );
        break;
      case "destination":
        updatedPlans.sort((a, b) => a.destination.localeCompare(b.destination));
        break;
      case "social":
        updatedPlans.sort((a, b) => a.social.localeCompare(b.social));
        break;
      default:
        break;
    }
    setFilteredPlans(updatedPlans);
  }, [searchQuery, sortOption, plans]);

  const onRefresh = () => {
    setRefreshing(true);
    setPlansChanged(true);
    fetchData().then(() => setRefreshing(false));
  };

  const handleDelete = async (item) => {
    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this plan?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            const response = await plansApi.deletePlan(item.planId);
            if (response) {
              setPlansChanged(true);
              const updatedPlans = plans.filter((plan) => plan.id !== item.id);
              setPlans(updatedPlans);
              // Update cached plans
              await AsyncStorage.setItem(
                "travelPlans",
                JSON.stringify(updatedPlans)
              );
              fetchData();
              showSuccessToast("Plan deleted successfully");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      "Delete Selected Plans",
      "Are you sure you want to delete the selected plans?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            const promises = selectedPlans.map((item) =>
              plansApi.deletePlan(item.planId)
            );
            await Promise.all(promises);
            setPlansChanged(true);
            setSelectedPlans([]);
            setIsSelectionMode(false);
            fetchData();
            showSuccessToast("Plans deleted successfully");
          },
        },
      ],
      { cancelable: false }
    );
  };

  const toggleSelectPlan = (item) => {
    setSelectedPlans((prevSelectedPlans) =>
      prevSelectedPlans.includes(item)
        ? prevSelectedPlans.filter((plan) => plan !== item)
        : [...prevSelectedPlans, item]
    );
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedPlans([]);
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isSameYear(start, end)) {
      return `${format(start, "MMMM dd")} - ${format(end, "MMMM dd, yyyy")}`;
    } else {
      return `${format(start, "MMMM dd, yyyy")} - ${format(
        end,
        "MMMM dd, yyyy"
      )}`;
    }
  };

  const renderRightActions = (item) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleDelete(item)}
    >
      <MaterialIcons name="delete" size={28} color="white" />
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        style={[
          styles.itemContainer,
          selectedPlans.includes(item) && styles.selectedItemContainer,
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelectPlan(item);
          } else {
            navigation.navigate("PlanDetails", {
              trip: item,
              image: destinationImages[item.destination],
            });
          }
        }}
      >
        {isSelectionMode && (
          <TouchableOpacity
            style={styles.circleCheckbox}
            onPress={() => toggleSelectPlan(item)}
          >
            <Ionicons
              name={
                selectedPlans.includes(item)
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={24}
              color={selectedPlans.includes(item) ? "green" : "black"}
            />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Paragraph style={styles.destination}>
            {item.destination}{" "}
            <Paragraph style={styles.social}>{item.social}</Paragraph>
          </Paragraph>
          <Paragraph style={{}}>
            {formatDateRange(item.arrivalDate, item.departureDate)}
          </Paragraph>
        </View>
        {destinationImages[item.destination] && (
          <Image
            source={{ uri: destinationImages[item.destination] }}
            style={styles.destinationImage}
          />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <HomeBackground>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header>Previous Plans</Header>
          <TouchableOpacity
            onPress={() => {
              if (isSelectionMode) {
                cancelSelectionMode();
              } else {
                setIsSelectionMode(true);
              }
            }}
          >
            <MaterialIcons
              name={isSelectionMode ? "cancel" : "select-all"}
              size={28}
              color="black"
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by destination"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <DropDownPicker
          open={open}
          value={sortOption}
          items={items}
          setOpen={setOpen}
          setValue={(callback) => {
            setSortOption((currentSortOption) => {
              const newSortOption = callback(currentSortOption);
              return newSortOption;
            });
            applyFilters();
          }}
          setItems={setItems}
          containerStyle={styles.dropdown}
        />

        {loading ? (
          <View style={styles.loadingOverlay}>
            <AnimatedLogo />
          </View>
        ) : (
          <>
            {filteredPlans.length > 0 ? (
              <FlatList
                data={filteredPlans}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              />
            ) : (
              <NoPlansMessage
                onGetStarted={() => navigation.navigate("Welcome")}
              />
            )}
          </>
        )}
      </View>
      {isSelectionMode && selectedPlans.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={handleDeleteSelected}>
            <Ionicons name="trash-bin" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    top: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dropdown: {
    marginBottom: 10,
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
  selectedItemContainer: {
    backgroundColor: "#69b9db",
  },
  circleCheckbox: {
    marginRight: 10,
  },
  destination: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  social: {
    fontSize: 18,
    marginBottom: 5,
  },
  destinationImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "92%",
    borderRadius: 5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 1,
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    backgroundColor: "red",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
