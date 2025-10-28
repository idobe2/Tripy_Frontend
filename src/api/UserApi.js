import clientApi from "./ClientApi";
import { Alert } from "react-native";
import { setToken, getToken, removeToken } from "../common/tokenStorage";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../core/firebaseConfig";

const userResetPassword = async (email) => {
  try {
    const response_mail = await clientApi.post(`/resetPass`, { email });
    return { success: true, message: response_mail.data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred. Please try again." };
  }
};

const userSignup = async (
  email,
  password,
  confirmPassword,
  name,
  formattedDateString,
  gender
) => {
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  try {
    const response_mail = await clientApi.post(`/post_email`, { email });
    const response_password = await clientApi.post(`/post_password`, {
      password,
    });

    if (response_mail.data !== "Email is available") {
      return {
        success: false,
        message: response_mail.data,
      };
    }

    if (response_password.data !== "Password received") {
      return {
        success: false,
        message: response_password.data,
      };
    }

    const post_response = await clientApi.post(`/signup`, {
      email,
      password,
      name,
      gender,
      birthday: formattedDateString,
    });

    if (post_response.data.success) {
      return {
        success: true,
        message: "You have successfully registered. Email verification sent.",
      };
    } else {
      return {
        success: false,
        message: post_response.data.message || "Error signing up",
      };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error signing up" };
  }
};

const userGoogleLogin = async () => {
  console.log("🟢 userGoogleLogin() started");

  try {
    console.log("➡️ Checking Google Play Services...");
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log("✅ Google Play Services available");

    console.log("➡️ Starting Google Sign-In flow...");
    const userInfo = await GoogleSignin.signIn();
    console.log("✅ Google Sign-In successful");
    console.log("👤 User info:", JSON.stringify(userInfo, null, 2));

    const credentialResponse = userInfo?.idToken;
    let googleToken = userInfo?.accessToken;

    console.log("📦 idToken:", credentialResponse ? "✅ exists" : "❌ missing");
    console.log("📦 accessToken:", googleToken ? "✅ exists" : "❌ missing");

    if (!googleToken) {
      console.log("⚠️ Access token missing, trying to fetch manually...");
      try {
        const tokens = await GoogleSignin.getTokens();
        googleToken = tokens?.accessToken;
        console.log(
          "🔁 Fetched access token:",
          googleToken ? "✅ success" : "❌ still missing"
        );
      } catch (tokenErr) {
        console.log("❌ Failed to fetch access token manually:", tokenErr);
      }
    }

    if (!credentialResponse) {
      throw new Error("❌ No idToken returned from Google Sign-In");
    }

    console.log("➡️ Creating Firebase credential...");
    const credential = GoogleAuthProvider.credential(credentialResponse);
    console.log("✅ Firebase credential created");

    console.log("➡️ Signing in with Firebase credential...");
    await signInWithCredential(auth, credential);
    console.log("✅ Firebase sign-in complete");

    console.log("➡️ Sending tokens to backend...");
    const response = await clientApi.post("/googleSignIn", {
      credentialResponse,
      googleToken,
    });
    console.log("✅ Backend response:", response.data);

    console.log("➡️ Saving tokens...");
    await setToken(response.data.accessToken, response.data.refreshToken);
    console.log("✅ Tokens saved successfully");

    console.log("🎉 userGoogleLogin() completed successfully");
    return response;
  } catch (error) {
    console.log("💥 ERROR in userGoogleLogin:", error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log("🚫 User cancelled the login flow");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log("⏳ Sign in is already in progress");
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log("⚠️ Play services not available or outdated");
    } else {
      console.log(
        "🔥 Unhandled Google Sign-In error:",
        error?.message || error
      );
      console.log("🔥 Full error object:", JSON.stringify(error, null, 2));
    }

    return { success: false, error };
  } finally {
    console.log("🔚 userGoogleLogin() finished (finally block)");
  }
};

const userGoogleSignOut = async () => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    // Sign out from Firebase
    await auth.signOut();
    console.log("Signed out successfully");
    return { success: true };
  } catch (error) {
    console.error("Error signing out", error);
    return { success: false, error };
  }
};

const userLogin = async (email, password) => {
  try {
    const response = await clientApi.post("/login", {
      email,
      password,
    });
    if (response.data === "You need to verify your email") {
      Alert.alert(response.data);
      return null;
    }
    const responseToFix1 = "Incorrect details " + password;
    const responseToFix2 = " and url: " + email;
    const responseToFix = responseToFix1 + responseToFix2;
    if (response.data === responseToFix) {
      Alert.alert("Invalid email or password. Please try again.");
      return null;
    }
    await setToken(response.data.accessToken, response.data.refreshToken);
    console.log("User logged in successfully");
    return response.data;
  } catch (error) {
    console.log("Api error:", error);
  }
  return null;
};

const addUser = async (name, formattedDateString, gender) => {
  try {
    const response = await clientApi.post("/addDetails", {
      name: name,
      birthday: formattedDateString,
      gender: gender,
    });
    console.log("User added successfully");
    return response.data;
  } catch (error) {
    console.log("Api error:", error);
  }
  return null;
};

const addUserPreferences = async (preferences) => {
  try {
    const response = await clientApi.post("/addPreferences", {
      preferences: preferences,
    });
    console.log("Preferences added successfully");
    return response.data;
  } catch (error) {
    console.log("Api error:", error);
  }
  return null;
};

const userLogout = async () => {
  try {
    const token = await getToken();
    if (token) {
      const response = await clientApi.get("/logout", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (await GoogleSignin.isSignedIn()) {
        console.log("Google sign out");
        await GoogleSignin.signOut();
      }
      await removeToken();
      return response.data;
    }
  } catch (err) {
    console.log("Logout fail " + err);
    throw err;
  }
};

const check = async () => {
  return clientApi.get("/check");
};

const getUserPreferences = async () => {
  try {
    const response = await clientApi.get("/getPreferences");
    return response.data;
  } catch (error) {
    console.log("Api error:", error);
  }
  return null;
};

const getUserDetails = async () => {
  try {
    const response = await clientApi.get("/getDetails");
    return response.data;
  } catch (error) {
    console.log("Api error:", error);
  }
  return null;
};

const userChangePassword = async (currentPassword, newPassword) => {
  try {
    const response = await clientApi.post("/changePassword", {
      currentPassword,
      newPassword,
    });
    // Returns the success message and data from the server
    return response.data;
  } catch (error) {
    console.log("Error changing password:", error);
    // Check if the error response has data and a message
    if (error.response && error.response.data) {
      // Display the specific error message received from the server
      Alert.alert("Error changing password", error.response.data.message);
    } else {
      // Generic error message if response data is not available
      Alert.alert("Error changing password. Please try again.");
    }

    return {
      success: false,
      message:
        error.response && error.response.data.message
          ? error.response.data.message
          : "Error changing password. Please try again.",
    };
  }
};

const userDeleteAccount = async (currentPassword) => {
  try {
    const response = await clientApi.post("/deleteAccount", {
      currentPassword,
    });
    return response.data;
  } catch (error) {
    console.log("Api error:", error);
    Alert.alert("Error deleting account. Please try again.");
  }
  return null;
};

const sendVerificationCode = async (email) => {
  try {
    const response = await clientApi.post("/SendMail", { email });
    return response.data;
  } catch (error) {
    console.error("Error sending verification code:", error);
    return { success: false, error: "Error sending verification code" };
  }
};

const verifyAndDeleteAccount = async (verificationCode) => {
  try {
    const response = await clientApi.post("/deleteUserData", {
      verifynumber: verificationCode,
    });
    if (await GoogleSignin.isSignedIn()) {
      console.log("Google sign out");
      await GoogleSignin.signOut();
    }
    await removeToken();
    return response.data;
  } catch (error) {
    console.error("Error verifying and deleting account:", error);
    return { success: false, error: "Error verifying and deleting account" };
  }
};

export default {
  addUser,
  addUserPreferences,
  getUserPreferences,
  getUserDetails,
  userLogin,
  userGoogleLogin,
  userGoogleSignOut,
  userSignup,
  userResetPassword,
  userLogout,
  check,
  userChangePassword,
  userDeleteAccount,
  sendVerificationCode,
  verifyAndDeleteAccount,
};
