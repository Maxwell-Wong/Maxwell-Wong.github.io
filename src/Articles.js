import React, { Component, useEffect, useState} from 'react'
import {
    Input, Box, Center, HStack, VStack, Heading, Button, ButtonGroup,
    useColorModeValue,
    ChakraProvider,
} from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Flex, Avatar, Text, } from '@chakra-ui/react';
import { LinkBox, LinkOverlay,SimpleGrid } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { AspectRatio } from '@chakra-ui/react'
import { FaArrowRight } from 'react-icons/fa';

import ReactMarkdown from 'react-markdown'
import mdfile from './Blog_Articles/React.md'
import bandker from './Blog_Articles/Banker.md'
import bbs from './Blog_Articles/BBS.md'
import memorysharing from './Blog_Articles/MemorySharing.md'

export function Articles(props) {
    
    const markdown = `### A paragraph with *emphasis* and **strong importance**`;
    const [terms, setTerms] = useState()
    console.log(mdfile)
    useEffect(() => {
        fetch(mdfile)
            .then((res) => res.text())
            .then((text) => {
                setTerms(text)
            })
    })
    return (
        <Box>
            <Heading textAlign='left'>Articles</Heading>
            <Text>Welcome to Maxwell Wong's Blog!!!</Text>
                <Text>A sufficiently advanced technology is indistinguishable from magic.</Text>
        
            <Grid
            templateAreas={`"A1" 
                            "A2"
                            "A3"
                            "A4"`}
                gridTemplateRows={'xl 1fr xl 1fr xl 1fr xl 1fr'}
                gridTemplateColumns={'xl 1fr xl 1fr xl 1fr xl 1fr'}
                h='lg'
                gap='1'
                fontWeight='bold'
            >
            <GridItem area={'A1'}>
            <Text fontSize="xl" marginTop="30px">Operating System</Text>
             <SimpleGrid columns={2} spacing={10}>        
                <Box >
                <LinkBox as='article' maxW='sm' p='3' borderWidth='1px' rounded='md'>
                    <Heading size='md' my='2'>
                        <LinkOverlay href='/blog/react-notes'>
                        React Notes
                        </LinkOverlay>
                    </Heading>
                    <Text mb='3' color="teal">Aug 05 2022</Text>
                    <Text mb='3'>
                    It’s a new component introduced in the v6 and a upgrade of the component. The main advantages of Routes over Switch are:Relative s and sRoutes are chosen based on the best match instead of being traversed in order.
                    </Text>
                    <Button rightIcon={<FaArrowRight/>} colorScheme='pink' variant='solid'>
                        Read more
                    </Button>        
                    {/* <Box as='a' color='teal.400' href='/blog/react-notes' fontWeight='bold'>
                        Some inner link
                    </Box> */}
                </LinkBox>  
                </Box>
                <Box >
                <LinkBox as='article' maxW='sm' p='3' borderWidth='1px' rounded='md'>
                    <Heading size='md' my='2'>
                        <LinkOverlay href='/blog/react-notes'>
                        React Notes
                        </LinkOverlay>
                    </Heading>
                    <Text mb='3' color="teal">Aug 05 2022</Text>
                    <Text mb='3'>
                    It’s a new component introduced in the v6 and a upgrade of the component. The main advantages of Routes over Switch are:Relative s and sRoutes are chosen based on the best match instead of being traversed in order.
                    </Text>
                    <Button rightIcon={<FaArrowRight/>} colorScheme='pink' variant='solid'>
                        Read more
                    </Button>        
                    {/* <Box as='a' color='teal.400' href='/blog/react-notes' fontWeight='bold'>
                        Some inner link
                    </Box> */}
                </LinkBox>  
                </Box>
                <Box >
                <LinkBox as='article' maxW='sm' p='3' borderWidth='1px' rounded='md'>
                    <Heading size='md' my='2'>
                        <LinkOverlay href='/blog/react-notes'>
                        React Notes
                        </LinkOverlay>
                    </Heading>
                    <Text mb='3' color="teal">Aug 05 2022</Text>
                    <Text mb='3'>
                    It’s a new component introduced in the v6 and a upgrade of the component. The main advantages of Routes over Switch are:Relative s and sRoutes are chosen based on the best match instead of being traversed in order.
                    </Text>
                    <Button rightIcon={<FaArrowRight/>} colorScheme='pink' variant='solid'>
                        Read more
                    </Button>        
                    {/* <Box as='a' color='teal.400' href='/blog/react-notes' fontWeight='bold'>
                        Some inner link
                    </Box> */}
                </LinkBox>  
                        </Box>
                        <Box >
                <LinkBox as='article' maxW='sm' p='3' borderWidth='1px' rounded='md'>
                    <Heading size='md' my='2'>
                        <LinkOverlay href='/blog/react-notes'>
                        React Notes
                        </LinkOverlay>
                    </Heading>
                    <Text mb='3' color="teal">Aug 05 2022</Text>
                    <Text mb='3'>
                    It’s a new component introduced in the v6 and a upgrade of the component. The main advantages of Routes over Switch are:Relative s and sRoutes are chosen based on the best match instead of being traversed in order.
                    </Text>
                    <Button rightIcon={<FaArrowRight/>} colorScheme='pink' variant='solid'>
                        Read more
                    </Button>        
                    {/* <Box as='a' color='teal.400' href='/blog/react-notes' fontWeight='bold'>
                        Some inner link
                    </Box> */}
                </LinkBox>  
                </Box>
            </SimpleGrid>
            </GridItem>
            <GridItem area={'A2'}>
            <Text fontSize="xl" marginTop="30px">Artificial Intelligence</Text>     
                <Box>
                <LinkBox as='article' maxW='sm' p='5' borderWidth='1px' rounded='md'>
                    <Box as='time' dateTime='2021-01-15 15:30:00 +0000 UTC'>
                        13 days ago
                    </Box>
                    <Heading size='md' my='2'>
                        <LinkOverlay href='#'>
                        New Year, New Beginnings: Smashing Workshops & Audits
                        </LinkOverlay>
                    </Heading>
                    <Text mb='3'>
                        Catch up on what’s been cookin’ at Smashing and explore some of the most
                        popular community resources.
                    </Text>
                    <Box as='a' color='teal.400' href='#' fontWeight='bold'>
                        Some inner link
                    </Box>
                    </LinkBox>  
   
                </Box>            

            </GridItem>
            <GridItem area={'A3'}>
            <Text fontSize="xl" marginTop="30px">Algorithm</Text>     
                <Box>
                <LinkBox as='article' maxW='sm' p='5' borderWidth='1px' rounded='md'>
                    <Box as='time' dateTime='2021-01-15 15:30:00 +0000 UTC'>
                        13 days ago
                    </Box>  
                    <Heading size='md' my='2'>
                        <LinkOverlay href='#'>
                        New Year, New Beginnings: Smashing Workshops & Audits
                        </LinkOverlay>
                    </Heading>
                    <Text mb='3'>
                        Catch up on what’s been cookin’ at Smashing and explore some of the most
                        popular community resources.
                    </Text>
                    <Box as='a' color='teal.400' href='#' fontWeight='bold'>
                        Some inner link
                    </Box>
                    </LinkBox>  
      
                </Box>              

            </GridItem>     
            <GridItem area={'A4'}>
            <Text fontSize="xl" marginTop="30px">Others</Text>     
                <Box>
                <AspectRatio ratio={16 / 9}>
                <iframe
                    src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.952912260219!2d3.375295414770757!3d6.5276316452784755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sLagos!5e0!3m2!1sen!2sng!4v1567723392506!5m2!1sen!2sng'
                    alt='demo'
                />
                </AspectRatio>
                </Box>                 

            </GridItem>
         </Grid>

        </Box>


    )


}