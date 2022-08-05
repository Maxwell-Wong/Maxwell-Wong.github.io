import React, { Component, useEffect, useState} from 'react'
import {
    Input, Box, Center, HStack, VStack, Heading, Button, ButtonGroup,
    useColorModeValue,
    ChakraProvider,
} from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Flex, Avatar, Text, } from '@chakra-ui/react';
import { LinkBox, LinkOverlay } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { AspectRatio } from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'
import mdfile from '../Blog_Articles/React.md'
export function ReactNotes(props) {
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
                <ReactMarkdown children={terms}/>,
            </GridItem>

         </Grid>

        </Box>


    )


}