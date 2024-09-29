import { Center, Container, VStack, Heading, Box, useColorModeValue, Button,
  InputGroup, Input, InputRightElement, Link } from '@chakra-ui/react';import { useState } from 'react';
import { useToast } from '@chakra-ui/react'
import React from "react"

const Login = () => {
  const [user, setUser] = useState({
    username: "",
    password: "",
  });

  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

  const toast = useToast();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/user/login', {
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
          description: "User successfully logged in.",
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
        description: "Server error logging in.",
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
                    name="Password"
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

            <Button colorScheme='blue' onClick={handleLogin} w='full'>
              Login
            </Button>

            <Link href={'/signup'}>Need an account?</Link>

          </VStack>
        </Box>
      </VStack>
    </Container>
    </Center>
  )
};

export default Login;