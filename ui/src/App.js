import {
  Flex,
  View,
  Provider,
  defaultTheme,
  Switch,
  Text,
} from "@adobe/react-spectrum";
import React, { useState } from "react";
import AppFooter from "./components/Footer";
import AppHeader from "./components/Header";
import LootboxList from "./components/LootboxList";
import { Outlet } from "react-router-dom";
import "./css/custom.css";
import "./App.css";
import "react-perfect-scrollbar/dist/css/styles.css";
import PerfectScrollbar from "react-perfect-scrollbar";

// Render it in your app!
function App(props) {
  const [selected, setSelection] = useState(false);
  let colorMode = "light";
  if (selected) {
    colorMode = "dark";
  } else {
    colorMode = "light";
  }
  return (
    <PerfectScrollbar>
      <Provider theme={defaultTheme} height="100%" colorScheme={colorMode}>
        <Flex
          direction="column"
          width="calc(max(100%, size-4200)"
          gap="size-100"
          borderWidth="thin"
          borderColor="dark"
          height="100%"
          overflow="auto"
        >
          <View backgroundColor="gray-200" height="size-400">
            <AppHeader setSelection={setSelection} />
          </View>
          <View
            backgroundColor="gray-50"
            width="calc(max(95%, size-3600)"
            height="100%"
            alignSelf="center"
            flex="true"
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
            padding="size-100"
            overflow="auto"
          >
            <Outlet />
          </View>
          <View backgroundColor="gray-200" height="size-400">
            <AppFooter />
          </View>
        </Flex>
      </Provider>
    </PerfectScrollbar>
  );
}

export default App;
