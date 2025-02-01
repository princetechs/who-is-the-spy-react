# Who is the Spy? - Multiplayer Game

## Project Overview
A real-time multiplayer game where players try to identify the spy among them through word-based gameplay. Built with React, Node.js, and WebSocket for real-time communication.

## Features
- Real-time multiplayer gameplay using WebSocket
- Game lobby system with host controls
- Two game modes: Wordless Spy and Unique Spy
- Timer system for pre-game and player turns
- Persistent game state management
- Responsive UI with Tailwind CSS

## Project Structure
```
/client
  /src
    /components      # React components (GameLobby, Timer, etc.)
    /services        # Game and socket service logic
    /store          # State management using Zustand
    /config         # Game configuration (word lists, etc.)
    App.jsx         # Main application component
    main.jsx        # Application entry point

/server.js          # Node.js WebSocket server
```

## Technical Implementation

### Frontend (React + Vite)
- **State Management**: Uses Zustand for efficient state handling
- **Socket Service**: Manages WebSocket connections and event handling
- **Game Service**: Handles game logic, timers, and state updates
- **Components**: Modular UI components with Tailwind CSS styling

### Backend (Node.js)
- WebSocket server for real-time communication
- Game state management and event handling
- Player session management

### Game Flow
1. Players can create or join game lobbies
2. Host configures game settings (mode, timers, word category)
3. Game starts with assigned roles (spy/villager) and words
4. Players take turns with timed interactions
5. Game concludes when spy is identified or escapes

### Current Features
- [x] Lobby system with game ID sharing
- [x] Real-time player updates
- [x] Game mode selection
- [x] Timer system
- [x] Role assignment
- [x] Turn management

## Development Status
The core game mechanics and real-time functionality are implemented. The project uses modern web technologies and follows best practices for state management and component architecture.

### Key Components
- **GameLobby**: Handles pre-game setup and player management
- **Timer**: Reusable component for various game timers
- **Socket Service**: Manages WebSocket communication
- **Game Service**: Coordinates game state and logic

### State Management
The game uses a centralized state management system with Zustand, handling:
- Player information
- Game state
- Timer states
- Player turns
- Connection status

## Next Steps
1. Implement game conclusion logic
2. Add more word categories
3. Enhance error handling
4. Add game statistics
5. Implement chat functionality

## Getting Started
To continue development:
1. Review the existing components in `/client/src/components`
2. Understand the socket and game services in `/client/src/services`
3. Check the state management in `/client/src/store`
4. Test the real-time functionality with multiple clients