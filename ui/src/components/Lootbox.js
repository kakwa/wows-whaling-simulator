import React from "react";
import { useEffect } from "react";
import axios from "axios";
import { Image } from "@adobe/react-spectrum";
import LootboxContent from "./LootboxContent";
import WhalingResults from "./WhalingResults";
import { Link } from "@adobe/react-spectrum";
import { Text } from "@adobe/react-spectrum";
import { Heading } from "@adobe/react-spectrum";
import { View } from "@adobe/react-spectrum";
import { Flex } from "@adobe/react-spectrum";
import { ContextualHelp } from "@adobe/react-spectrum";
import { Form } from "@adobe/react-spectrum";
import { Switch } from "@adobe/react-spectrum";
import { Grid } from "@adobe/react-spectrum";
import { Divider } from "@adobe/react-spectrum";
import { IllustratedMessage } from "@adobe/react-spectrum";
import { NumberField } from "@adobe/react-spectrum";
import {
  ComboBox,
  ActionButton,
  AlertDialog,
  ButtonGroup,
  Button,
  DialogTrigger,
  Slider,
  Picker,
  Item,
  SearchField,
  DialogContainer,
  TextField,
} from "@adobe/react-spectrum";
import { Content } from "@adobe/react-spectrum";
import {
  Tabs,
  TabList,
  TabPanels,
  TableView,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  ListView,
} from "@adobe/react-spectrum";
import { ListBox } from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import { Section } from "@adobe/react-spectrum";
import { Link as RouterLink } from "react-router-dom";
import { useParams } from "react-router-dom";
import NotFound from "@spectrum-icons/illustrations/NotFound";
import Money from "@spectrum-icons/workflow/Money";
import Back from "@spectrum-icons/workflow/Back";
import User from "@spectrum-icons/workflow/User";
import Star from "@spectrum-icons/workflow/Star";
import Delete from "@spectrum-icons/workflow/Delete";
import { useAsyncList } from "react-stately";
import GenericTile from "./GenericTile";

import { API_ROOT } from "../api-config";

function checkUnset(props) {
  return props === undefined || props === null || props.length === 0;
}

function WhaleBox(props) {
  const [isOpen, setOpen] = React.useState(false);
  const [realm, setRealm] = React.useState();
  const [player, setPlayer] = React.useState();
  const [targetMode, setTargetMode] = React.useState();
  const [numlootbox, setNumlootbox] = React.useState(20);
  const [ship, setShip] = React.useState("");
  const [shipList, setShipList] = React.useState([]);
  const [shipExcludeList, setShipExcludeList] = React.useState([]);
  const [shipExcludeListInput, setShipExcludeListInput] = React.useState([]);
  const [shipInput, setShipInput] = React.useState("");

  let realmOptions = [
    { id: "eu", name: "EU" },
    { id: "na", name: "NA" },
    { id: "asia", name: "Asia" },
  ];

  let whalingModeOptions = [
    { id: "simple_whaling_quantity", name: "Quantity Whaling - Single Run" },
    { id: "stats_whaling_quantity", name: "Quantity Whaling - Statistics" },
    { id: "simple_whaling_target", name: "Target Whaling - Single Run" },
    { id: "stats_whaling_target", name: "Target Whaling - Statistics" },
  ];

  const setRealmReset = (value) => {
    // Reset Player when changing Realm
    setPlayer();
    list.setFilterText("");
    setRealm(value);
    setShipExcludeList([]);
  };

  const refreshShips = (selected) => {
    axios
      .get(
        `${API_ROOT}/api/v1/lootboxes/${props.lootboxId}/realms/${realm}/players/${selected}/remainingships`
      )
      .then((res) => {
        const ships = res.data.ships;
        console.log(ships);
        const shipObjList = ships.map((ship) => ({ name: ship }));
        setShipList(shipObjList);
        setShipExcludeListInput(shipObjList);
      });
  };

  let list = useAsyncList({
    async load({ signal, cursor, filterText }) {
      if (filterText.length < 3) {
        return {
          items: [],
        };
      }
      let res = await fetch(
        `${API_ROOT}/api/v1/realms/${realm}/players?nick_start=${filterText}`,
        { signal }
      );
      let json = await res.json();

      return {
        items: json.players,
      };
    },
  });

  const notSubmitable = () => {
    // If Either of this parameters are unset, return true (form not submitable)
    if (checkUnset(player) || checkUnset(targetMode)) {
      return true;
    }
    // If we are in one of the target mode, and no ship target is set, return true (form not submitable)
    if (
      (targetMode === "simple_whaling_target" ||
        targetMode === "stats_whaling_target") &&
      checkUnset(ship)
    ) {
      return true;
    }

    // Otherwise, return false (form submitable)
    return false;
  };

  const addShipExclusion = (ship) => {
    if (ship === null) {
      return;
    }
    setShipExcludeList([ship, ...shipExcludeList]);

    // Remove the selected ship from the exclusion list input
    let filteredArray = shipExcludeListInput.filter(
      (item) => item.name !== ship
    );
    setShipExcludeListInput(filteredArray);
  };

  const delShipExclusion = (ship) => {
    let filteredArray = shipExcludeList.filter((item) => item !== ship);
    setShipExcludeList(filteredArray);

    // Add the ship back in the exclusion list input
    setShipExcludeListInput((shipExcludeListInput) => [
      { name: ship },
      ...shipExcludeListInput,
    ]);
  };

  const triggerWhaling = () => {
    switch (targetMode) {
      case "simple_whaling_quantity":
      case "stats_whaling_quantity":
        axios
          .get(
            `${API_ROOT}/api/v1/lootboxes/${props.lootboxId}/realms/${realm}/players/${player}/${targetMode}`,
            { params: { number_lootbox: numlootbox } }
          )
          .then((res) => {
            const stats = res.data;
            props.setStats(stats);
            props.setTab("whaling");
          });
        break;
      case "simple_whaling_target":
      case "stats_whaling_target":
        axios
          .get(
            `${API_ROOT}/api/v1/lootboxes/${props.lootboxId}/realms/${realm}/players/${player}/${targetMode}`,
            { params: { target: ship, excluded_ships: shipExcludeList } }
          )
          .then((res) => {
            const stats = res.data;
            props.setStats(stats);
            props.setTab("whaling");
          });
        break;
    }
  };

  const setPlayerRefresh = (selected) => {
    setPlayer(selected);
    refreshShips(selected);
    setShipExcludeList([]);
  };
  return (
    <>
      <Flex direction="row" gap="size-400">
        <Button
          variant="negative"
          style="fill"
          height="size-600"
          onPress={() => setOpen(true)}
        >
          <Money />
          <Text>Start Whaling!</Text>
        </Button>
      </Flex>

      <DialogContainer onDismiss={() => setOpen(false)} minWidth="size-6000">
        {isOpen && (
          <AlertDialog
            title="Let's Do Some Whaling"
            variant="confirmation"
            primaryActionLabel="Start Whaling"
            cancelLabel="Cancel"
            onPrimaryAction={triggerWhaling}
            isPrimaryActionDisabled={notSubmitable()}
          >
            <Form>
              <Picker
                label="Realm/Wows Server"
                items={realmOptions}
                onSelectionChange={(selected) => setRealmReset(selected)}
                autoFocus="true"
                defaultSelectedKey={realm}
              >
                {(item) => <Item>{item.name}</Item>}
              </Picker>
              <ComboBox
                label="Player Search"
                items={list.items}
                inputValue={list.filterText}
                onInputChange={list.setFilterText}
                loadingState={list.loadingState}
                isDisabled={checkUnset(realm)}
                onSelectionChange={(selected) => setPlayerRefresh(selected)}
              >
                {(item) => <Item key={item.account_id}>{item.nickname}</Item>}
              </ComboBox>

              <Picker
                label="Simulation Mode"
                items={whalingModeOptions}
                onSelectionChange={setTargetMode}
                defaultSelectedKey={targetMode}
              >
                {(item) => <Item>{item.name}</Item>}
              </Picker>

              {((targetMode === "simple_whaling_target" ||
                targetMode === "stats_whaling_target") && (
                <>
                  <ComboBox
                    label="Ship Search"
                    defaultItems={shipList}
                    selectedKey={ship}
                    onSelectionChange={setShip}
                    onInputChange={setShipInput}
                    defaultInputValue={shipInput}
                    isDisabled={checkUnset(player)}
                    onSelectionChange={(selected) => setShip(selected)}
                  >
                    {(item) => <Item key={item.name}>{item.name}</Item>}
                  </ComboBox>
                  <ComboBox
                    label="Exclude Ship"
                    defaultItems={shipExcludeListInput}
                    isDisabled={checkUnset(player)}
                    defaultInputValue=""
                    onSelectionChange={(selected) => addShipExclusion(selected)}
                  >
                    {(item) => <Item key={item.name}>{item.name}</Item>}
                  </ComboBox>
                  {shipExcludeList.length === 0 || (
                    <ListView
                      selectionMode="none"
                      aria-label="ship-exclude-list"
                      maxWidth="size-6000"
                      density="compact"
                    >
                      {shipExcludeList.map((ship) => (
                        <Item key={ship}>
                          <Text>{ship}</Text>
                          <ActionButton
                            onPress={(e) => delShipExclusion(ship)}
                            aria-label="Icon only"
                          >
                            <Delete />
                          </ActionButton>
                        </Item>
                      ))}
                    </ListView>
                  )}
                </>
              )) || (
                <Flex direction="row" gap="size-100" wrap>
                  <View>
                    <Slider
                      label="Number of containers"
                      value={numlootbox}
                      minWidth="size-3200"
                      maxValue="1000"
                      showValueLabel={false}
                      minValue={1}
                      onChange={setNumlootbox}
                    />
                  </View>
                  <View marginTop="calc(single-line-height/2)">
                    <NumberField
                      minWidth="calc(size-1200 * 1.33)"
                      width="calc(size-1200 * 1.33)"
                      value={numlootbox}
                      minValue={1}
                      maxValue="1000"
                      onChange={setNumlootbox}
                    />
                  </View>
                </Flex>
              )}
            </Form>
          </AlertDialog>
        )}
      </DialogContainer>
    </>
  );
}

function Lootbox() {
  const [stats, setStats] = React.useState(false);
  const [tabSelected, setTabSelected] = React.useState("container");
  const [lootbox, setLootbox] = React.useState(false);
  const navigate = useNavigate();
  let { lootboxId } = useParams();

  const GoHome = () => {
    navigate("/");
  };

  const [isOpen, setOpen] = React.useState(false);
  useEffect(() => {
    axios.get(`${API_ROOT}/api/v1/lootboxes/${lootboxId}`).then((res) => {
      const lootbox = res.data;
      setLootbox(lootbox);
    });
  }, [lootboxId]);

  const validateInput = () => {
    return false;
  };
  let defaultTab = "container";
  let disabledTabs = ["whaling"];
  if (stats) {
    defaultTab = "whaling";
    disabledTabs = [];
  }
  return (
    <Flex
      margin="size-100"
      direction="column"
      gap="size-100"
      justifyContent="center"
      alignContent="center"
      alignItems="center"
    >
      <View>
        <WhaleBox
          lootboxId={lootboxId}
          setStats={setStats}
          setTab={setTabSelected}
        />
      </View>

      <Divider size="S" />
      <Tabs
        disabledKeys={disabledTabs}
        selectedKey={tabSelected}
        onSelectionChange={setTabSelected}
      >
        <Flex>
          <View width="85%">
            <TabList>
              <Item key="container">Container Drop Rates</Item>
              <Item key="whaling">Whaling Session</Item>
            </TabList>
          </View>
          <View width="15" marginTop="calc(single-line-height)">
            <Button variant="secondary" style="outline" onPress={GoHome}>
              <Back />
              <Text>Back To Container List</Text>
            </Button>
          </View>
        </Flex>
        <TabPanels>
          <Item key="container">
            <Heading>Lootbox Info:</Heading>
            <LootboxContent lootbox={lootbox} />
          </Item>
          {stats && (
            <Item key="whaling">
              <View>
                <Heading>Whaling results:</Heading>
                <WhalingResults whalingData={stats} />
              </View>
            </Item>
          )}
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default Lootbox;
