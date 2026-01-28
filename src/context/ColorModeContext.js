import { createContext } from 'react';

const ColorModeContext = createContext({
    toggleColorMode: () => { },
    mode: 'dark' // Default to dark mainly for type hints/fallback
});

export default ColorModeContext;
