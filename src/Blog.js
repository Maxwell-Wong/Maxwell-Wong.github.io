import React, { Component, useState, useEffect} from 'react'
import { Articles } from './Articles.js';
import {
    Input, Box, Center, HStack, VStack, Heading, Button, ButtonGroup, useColorMode,
    useColorModeValue,
    ChakraProvider,
} from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Flex, Avatar, Text, } from '@chakra-ui/react';
import { variables } from './variables.js'
import { Badge, Stack } from '@chakra-ui/react'
import { Divider, InputLeftElement, InputGroup, } from '@chakra-ui/react';
import { Wrap, WrapItem, Spacer, IconButton, Code } from '@chakra-ui/react';
import { Search2Icon, MoonIcon, EmailIcon, SunIcon, ChatIcon } from '@chakra-ui/icons';
import { FaGithub, FaHeart,FaFileAlt, FaFile, FaBookmark,FaCode,FaSmileBeam,FaSmile} from 'react-icons/fa';
import { LinkBox, LinkOverlay } from '@chakra-ui/react';
import { Grid, GridItem, Container } from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {
    List,
    ListItem,
    ListIcon,
    OrderedList,
    UnorderedList,
} from '@chakra-ui/react'
  
import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
} from '@chakra-ui/react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
  } from '@chakra-ui/react'
const avatar_src = "https://avatars.githubusercontent.com/u/73838171?s=400&u=33260630566903ad3080dce078d872de8b92ff42&v=4"
export function Blog(props) {
    const { colorMode, toggleColorMode } = useColorMode()
    const [date, setDate] = useState(Date());
    const [like, setLike] = useState(0);
    const bg = useColorModeValue('red.500', 'red.200')
    const [RenderPage, setRenderPage] = useState(<Articles />)
    const [ArticleId, setArticleId] = useState(0);
    const RouteChange = (opt) => {
        let GithubPage = 'https://github.com/Maxwell-Wong';
        let Email = 'mailto:78146185@qq.com';
        if (opt == "github") {
            window.open(GithubPage,'_blank', 'noopener,noreferrer')
        }
        else if (opt == "email") {
            window.open(Email,'_blank', 'noopener,noreferrer')
        }

    }

    useEffect(() => {
        const Interval = setInterval(() => {
            setDate(Date())
        }, 1000)
        return () => {
            clearInterval(Interval)
        }
    }, [date]);

    // useEffect(() => {

    // })
    
    return (
        <Grid
  templateAreas={`"header header header"
                  "nav main nav2"
                  "nav main nav2"`}
  gridTemplateRows={'100px 1fr 50px'}
  gridTemplateColumns={'250px 1fr 300px'}
  gap='1'
  fontWeight='bold'
            
>
    <GridItem pl='2' area={'header'}>
        <Flex alignItems='center' minWidth='fit-content' h="85px">
            <HStack spacing="10px" >
                    <Avatar name='Brain' src={avatar_src} marginLeft="10px"/>
                    <Text fontWeight='bold'>Maxwell Wong's Blog</Text>
            </HStack>
            <Spacer />
                <Box alignSelf="center" w="900px" maxW="1000px">
                    <InputGroup >
                        <InputLeftElement
                                pointerEvents='none'
                                children={<Search2Icon color='gray.300' />}
                                    />
                        <Input type='text' placeholder='Search Articles' boxShadow="md"/>
                    </InputGroup>
                
                </Box>
                <Spacer/>
                <Box>   
                    <IconButton colorScheme='tail' icon={<FaGithub />} marginRight="5px" variant='ghost' onClick={()=>RouteChange('github')}/>
                    <IconButton colorScheme='tail' icon={<EmailIcon />}  marginRight="5px" variant='ghost' onClick={()=>RouteChange('email')}/>
                    <IconButton colorScheme='tail' icon={colorMode === 'light' ? <MoonIcon/> : <SunIcon/>} onClick={toggleColorMode}  marginRight="5px" variant='ghost' />
                </Box>
                <Spacer/>
                <Button leftIcon={<FaHeart />} colorScheme='pink' variant='solid' marginRight="15px">
                    Sponsor
                </Button>
                </Flex>
    </GridItem>
        <Divider /> 
        <GridItem pl='2' area={'nav'}  overflow="auto">
            <Box display="flex" >
            <LinkBox as='article' maxW='sm' p='5' rounded='md' pl='5'>
            <VStack align="self-start" marginLeft="10px" marginTop="30px" spacing="20px">
                <LinkOverlay href='/'  fontWeight="bold">
                    <IconButton colorScheme='tail' size='sm' icon={<FaSmileBeam/>} marginRight="10px" variant='outline' />
                    Profile
                </LinkOverlay>
                    
                <LinkOverlay href='/' fontWeight="bold">
                    <IconButton colorScheme='tail' size='sm' icon={<FaFileAlt/>} marginRight="10px" variant='outline'/>
                    Articles
                </LinkOverlay>
                        
                <LinkOverlay href='/' fontWeight="bold">
                    <IconButton colorScheme='tail' size='sm' icon={<FaBookmark/>} marginRight="10px" variant='outline'/>
                    Recommendation
                </LinkOverlay>
                <LinkOverlay href='/' fontWeight="bold">
                    <IconButton colorScheme='tail' size='sm' icon={<FaFile/>} marginRight="10px" variant='outline'/>
                    Information
                </LinkOverlay>
                <LinkOverlay href='/' fontWeight="bold">
                    <IconButton colorScheme='tail' size='sm' icon={<FaCode/>} marginRight="10px" variant='outline'/>
                    Plugins
                </LinkOverlay>
                <LinkOverlay href='/' fontWeight="bold">
                    <IconButton colorScheme='tail' size='sm' icon={<ChatIcon/>} marginRight="10px" variant='outline'/>
                    FeedBack
                </LinkOverlay>
            
            </VStack>
            </LinkBox>        
            </Box>
        </GridItem>
    
        <GridItem pl='3' area={'main'} overflow="auto">
            {RenderPage}
            <Box textAlign="end"  alignSelf="baseline" position="fixed" marginTop="40px">
                    <IconButton colorScheme='tail' icon={<FaGithub />} marginRight="5px" variant='ghost' onClick={()=>RouteChange('github')}/>
            <IconButton colorScheme='tail' icon={<EmailIcon />} marginRight="5px" variant='ghost' onClick={()=>RouteChange('email')}/>
                    <Badge variant='outline' colorScheme='cyan'>@Maxwell-Wong</Badge>
            </Box>
        </GridItem>
    
        <GridItem area={'nav2'} textAlign="left" marginLeft="10px">
        <Box maxW='sm' boxShadow="xl" borderWidth='1px' borderRadius="md" marginRight="10px">
                   <Center>Current Time<br/></Center> 
                        {date}
        </Box> 
        <List spacing={6} mt="10px" mr="10px">
            <ListItem>
                <ListIcon color='green.500' as={FaBookmark} />
                        Talent hits a target no one else can hit. Genius hits a target no one else can see.<br />
                        ― Arthur Schopenhauer
            </ListItem>
            <ListItem>
                <ListIcon  color='green.500' as={FaBookmark}/>
                        A man can be himself only so long as he is alone; and if he does not love solitude, he will not love freedom; for it is only when he is alone that he is really free.<br />
                        ― Arthur Schopenhauer
            </ListItem>
            <ListItem>
                <ListIcon color='green.500' as={FaBookmark}/>
                        Mostly it is loss which teaches us about the worth of things.<br/>
                        ― Arthur Schopenhauer
            </ListItem>

            <ListItem>
                <ListIcon  color='green.500' as={FaBookmark}/>
                        The assumption that animals are without rights and the illusion that our treatment of them has no moral significance is a positively outrageous example of Western crudity and barbarity. Universal compassion is the only guarantee of morality.<br />
                        ― Arthur Schopenhauer
            </ListItem>
        </List>
      </GridItem>
            
    {/* <GridItem area={'footer'} textAlign="center" position="revert" bgColor="yellow">
        <IconButton colorScheme='tail' icon={<FaGithub />} marginRight="5px" variant='ghost'/>
        <IconButton colorScheme='tail' icon={<EmailIcon />} marginRight="5px" variant='ghost' />
        <Badge variant='outline' colorScheme='cyan'>@Maxwell-Wong</Badge>
    </GridItem> */}
  
    </Grid>
    )
}

