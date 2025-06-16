import { useState } from 'react'
import { createTheme, ThemeProvider } from '@mui/material'
import { BrowserRouter as Router, Routes } from "react-router-dom";
import { lightBlue } from '@mui/material/colors';

import Sidebar from './components/sidebar'
import { mapRoutes } from './functions.jsx';
import routes from './routes';
import './App.css'

function App() {
    return (
        <ThemeProvider theme={createTheme({
            status: {
                danger: lightBlue[500],
            },
        })} >
            <Router>
                <Sidebar routes={routes}>
                    <Routes>{mapRoutes(routes)}</Routes>
                </Sidebar>

                <footer className="App-header">

                </footer>
            </Router>
        </ThemeProvider>
    )
}

export default App
