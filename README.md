# Tripy - Your Ultimate Travel App

![Tripy Logo](https://i.postimg.cc/9QQSJKRd/logo.png)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Introduction

🌍 Tripy is your ultimate travel app, helping you plan, organize, and enjoy your trips effortlessly. From finding the best activities to keeping track of your travel plans, Tripy makes your travel experience seamless and enjoyable. ✈️🧳

## Features

- **User Registration & Login**: Register and login using email or Google.
- **Personal Preferences**: Select your travel preferences for a personalized experience.
- **Trip Planning**: Create, edit, and manage your travel plans with ease.
- **Plans Customization**: Replace activities and add restaurants to your plan easily.
- **Activity Tracking**: Keep track of your activities and explore new features.

## Demo Video

🎥 Want to see Tripy in action?  
👉 [Click here to watch the demo video](https://1drv.ms/v/c/be84aa2a7d5d1de8/EUczsxloJzJLpX2uT6-JmZMBBkqVrpLUOqp7IzPcAmT_ag)  
The video provides an overview of the main features and flow of the Tripy app.

## Screenshots

<img src="https://i.postimg.cc/0y8q3SC7/Screenshot-20240724-210343-tripy.png" width="200" height="400">  <img src="https://i.postimg.cc/LXnqPXQZ/Screenshot-20240724-210413-tripy.png" width="200" height="400">  <img src="https://i.postimg.cc/mggTkn5P/Screenshot-20240724-211606-tripy.png" width="200" height="400">  <img src="https://i.postimg.cc/G3KNtpwj/Screenshot-20240724-211621-tripy.png" width="200" height="400">

## Installation

To get a local copy up and running follow these simple steps:

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation Steps

1. Clone the repo

```sh
git clone https://github.com/idobe2/NetworkingApp.git
```

2. Install NPM packages

```sh
npm install
```

or

```sh
yarn install
```

4. Start the development server

```sh
npx expo start
```

## Usage

### Running the App

1. Open your favorite terminal and run the development server:

```sh
npx expo run:android --variant release
```

2. Wait for the process to finish and then open the app on your mobile device.

### Navigation

- **Explore**: Explore features and see next activities.
- **Planner**: Create and manage your trip plans.
- **Previous Plans**: View and edit your past trips.

### Drawer
- **Preferences**: Select your travel preferences.
- **Settings**: Modify settings of your account.
- **About**: Find out more about Tripy and talk to us.

## API Reference

### User Authentication

- **POST** `/api/auth/register`: Register a new user.
- **POST** `/api/auth/login`: Authenticate a user.
- **POST** `/api/auth/google`: Authenticate via Google.`

### Trip Management

- **POST** `/api/addPlan`: Add a new trip plan.
- **GET** `/api/getUserPlanIds`: Get all trip plan IDs for a user.
- **POST** `/api/getPlanById`: Get details of a specific trip plan by ID.
- **POST** `/api/deletePlan`: Delete a trip plan by ID.

### User Management

- **POST** `/api/addDetails`: Add user details.
- **GET** `/api/getDetails`: Get user details.

- **GET** `/api/getPreferences`: Get user preferences.
- **POST** `/api/changePassword`: Change user password.
- **POST** `/api/deleteAccount`: Delete user account.
  
### Preferences

- **POST** `/api/addPreferences`: Add user preferences.
- **GET** `/api/getPreferences`: Get user preferences.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

📧 **Tripy Team** – [Tripy@tech-center.com](mailto:Tripy@tech-center.com)  
🔗 **Backend Repo** – [Tripy Backend](https://github.com/Bar1996/Tripy_Backend)  

