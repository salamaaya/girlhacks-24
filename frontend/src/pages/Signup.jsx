import { Center, Container, VStack, Heading, Box, useColorModeValue, Button,
          InputGroup, Input, InputRightElement } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useToast } from '@chakra-ui/react';

const Signup = () => {
  const [user, setUser] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

  const toast = useToast();

  const handleSignup = async () => {
    if (user.password !== user.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "User successfully registered",
          status: "success",
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          status: "error",
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during signup",
        status: "error",
        isClosable: true,
      });
    }
  };

  return (
    <Center h="100vh">
      <Container maxW={"40vw"} maxH={'50vh'} pos={'50vh'}>
        <VStack spacing={8}>
          <Heading as={"h1"} size={"2xl"} textAlign={"center"} mb={8}>
            Welcome!
          </Heading>

          <Box w={"full"} bg={useColorModeValue("white", "gray.800")} p={6} rounded={"lg"} shadow={"md"}>
            <VStack spacing={4}>
              <Input
                placeholder="Username"
                name="username"
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />

          <InputGroup size='md'>
                  <Input
                    placeholder={"Password"}
                    name="password"
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                    type={show ? 'text' : 'password'}
                  />
                  <InputRightElement width='4.5rem'>
                    <Button h='1.75rem' size='sm' onClick={handleClick}>
                      {show ? 'Hide' : 'Show'}
                    </Button>
                  </InputRightElement>
            </InputGroup>

            <InputGroup size='md'>
                  <Input
                    placeholder={"Confirm password"}
                    name="confirmPassword"
                    value={user.confirmPassword}
                    onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                    type={show ? 'text' : 'password'}
                  />
                  <InputRightElement width='4.5rem'>
                    <Button h='1.75rem' size='sm' onClick={handleClick}>
                      {show ? 'Hide' : 'Show'}
                    </Button>
                  </InputRightElement>
            </InputGroup>

              <Button colorScheme="blue" onClick={handleSignup} w="full">
                Signup
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Center>
  );
};

export default Signup;