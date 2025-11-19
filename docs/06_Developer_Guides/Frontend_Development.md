# Flowlet Web Frontend Development Guide

This guide provides instructions for setting up the development environment, understanding the project structure, and contributing to the Flowlet web frontend application.

## Technologies Used

The Flowlet web frontend is built using the following technologies:

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool that provides a lightning-fast development experience.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **Shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS.

## Project Structure

The main source code for the web frontend is located in `Flowlet/frontend/web-frontend/src/`.

- `src/main.jsx`: The entry point of the application.
- `src/App.jsx`: The main application component.
- `src/pages/`: Contains individual page components (e.g., `DashboardPage.jsx`, `LoginPage.jsx`).
- `src/components/`: Reusable UI components.
- `src/contexts/`: React Context API for global state management (e.g., `AuthContext.jsx`, `ThemeContext.jsx`).
- `src/hooks/`: Custom React hooks.
- `src/lib/`: Utility functions and helper modules.
- `src/assets/`: Static assets like images and icons.
- `src/index.css`, `src/App.css`: Global stylesheets.

## Development Setup

To set up the development environment, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/abrar2030/Flowlet.git
    cd Flowlet/frontend/web-frontend
    ```

2.  **Install dependencies**:
    The project uses `pnpm` as the package manager. If you don't have `pnpm` installed, you can install it via npm:
    ```bash
    npm install -g pnpm
    ```
    Then, install the project dependencies:
    ```bash
    pnpm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the `Flowlet/frontend/web-frontend/` directory based on `example.env` (if available) or consult the backend documentation for required API endpoints. Typically, you might need to configure the backend API URL:
    ```
    VITE_API_BASE_URL=http://localhost:5000/api/v1
    ```

4.  **Run the development server**:
    ```bash
    pnpm dev
    ```
    This will start the development server, usually accessible at `http://localhost:5173` (or another port if 5173 is in use). The application will automatically reload when you make changes to the source code.

## Building for Production

To build the application for production, run:

```bash
pnpm build
```

This will generate optimized static assets in the `dist/` directory, which can then be deployed to a static web server.

## Code Style and Linting

The project uses ESLint for code linting. Ensure your code adheres to the defined style guidelines. You can run the linter manually:

```bash
pnpm lint
```

Many IDEs have ESLint integrations that can provide real-time feedback.

## Contributing

When contributing to the web frontend, please follow these guidelines:

- Create a new branch for your features or bug fixes.
- Write clear and concise commit messages.
- Ensure your code is well-commented.
- Test your changes thoroughly.
- Adhere to the existing code style.

For more general contribution guidelines, refer to the main [Contributing Guide](CONTRIBUTING.md) of the Flowlet project.
