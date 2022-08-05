import React, { Component } from 'react'
import { Input, Box, Center, HStack, VStack, Heading, Button, ButtonGroup } from '@chakra-ui/react'
import { variables } from './variables.js'
import { LinkBox, LinkOverlay } from '@chakra-ui/react'
import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
} from '@chakra-ui/react'
  
export class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            Comment: "",
            FileName: "",
            FilePath: variables.UPLOAD_FILE_URL,
            
            
        };
    
        // 为了在回调中使用 `this`，这个绑定是必不可少的
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleGet() {
        fetch(variables.UPLOAD_FILE_URL)
            .then(response => response.json())
            .then(data => console.log(data));
        

    }
    handleSubmit() {
        fetch(variables.UPLOAD_FILE_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Content: this.state.Comment,
                File: this.state.FilePath  //需要修改
            })

        })
        .then(response => response.json())
        .then((result) => {
            alert(result);
        }, (error) => {
            alert('Failed.'); 
        })
    
    // fileUpload=(e)=>{
    //     e.preventDefault();

    // }
}


    render(){
        return (
            <VStack spacing={4}>
            <Heading >
                    This is Home page.
            </Heading>
            <Box>
                <FormControl>
                    <FormLabel>Pipeline</FormLabel>
                    <Input type='file' onChange={this.fileUpload}/>
                    <FormHelperText>Choose file to process</FormHelperText>
                    <Input  mt={4} placeholder='Leave your message'/>
                    <Button mt={4} onClick={()=>this.handleSubmit} type='submit'>Submit & Run</Button>   

                </FormControl>
                    
                    
                </Box>
                <LinkBox as='article' maxW='sm' p='5' rounded='md'>
                <Box as='time' dateTime='2021-01-15 15:30:00 +0000 UTC'>
                <LinkOverlay href='/Blog'>
                    New Year, New Beginnings: Smashing Workshops & Audits
                </LinkOverlay>
                </Box>
            </LinkBox>      
            </VStack>
        )

    }

}