import {
  Flex,
  Header,
  View,
  Button,
  Provider,
  defaultTheme,
  Switch,
  Text,
  Content,
  Divider,
  Link,
  IllustratedMessage,
  Image,
} from "@adobe/react-spectrum";
import { Link as RouterLink } from "react-router-dom";
import { useRouteError } from "react-router-dom";

function Error(props) {
  const error = useRouteError();
  console.error(error);
  return (
    <Flex
      direction="column"
      width="100%"
      gap="size-100"
      borderWidth="thin"
      borderColor="dark"
      height="100%"
    >
      <View
        backgroundColor="gray-50"
        width="size-6000"
        height="size-6000"
        alignSelf="center"
        flex="true"
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-100"
      >
        <IllustratedMessage>
          <Image src="/logo512.png" alt="Whale" />
          <Divider />
          <Content>
            <Text>
              <h1>Oops! Something went wrong</h1>
              <section>
                <h2>Message</h2>
                {error.statusText || error.message}
              </section>

              <section>
                <h2>Whatever...</h2>
                <Link>
                  <RouterLink to="/">Back to Container List</RouterLink>
                </Link>
              </section>
            </Text>
          </Content>
        </IllustratedMessage>
      </View>
    </Flex>
  );
}

export default Error;
