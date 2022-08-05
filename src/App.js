import './App.css';
import { Home } from './Home';
import { Blog } from './Blog';
import {ReactNotes} from './Blog_Components/ReactNotes'
import {BrowserRouter, Route, Router, Routes} from 'react-router-dom';
import { Link } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Box, ChakraProvider, extendTheme } from '@chakra-ui/react';
function App() {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <Routes>
          {/* <Route path="/" element={<Home />}></Route> */}
          <Route path="/" element={<Blog />}></Route>
          <Route path="/blog/react-notes" element={<ReactNotes />}></Route>
        </Routes>


      </ChakraProvider>
    </BrowserRouter>
    
  );
}

export default App;
