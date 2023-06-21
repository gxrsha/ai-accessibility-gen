# AI Alt Text Generator 🖼️🤖

AI Alt Text Generator is a web application that utilizes cutting-edge AI technologies to automatically generate alternative text for images. The application aims to enhance web accessibility, especially for visually impaired users.

## Features ✨

- **Upload Image**: Users can upload an image of their choice to be analyzed.
- **Image Analysis**: Utilizes Google Cloud Vision API to analyze various aspects of the uploaded image, including labels, landmarks, faces, text, and objects.
- **Alt Text Generation**: Uses OpenAI's GPT (Generative Pre-trained Transformer) to generate descriptive and concise alternative text for the image based on the analysis.
- **Display Results**: The generated alt text is displayed on the user interface.
- **Image Compression**: Compresses uploaded images for faster processing and lower bandwidth usage.
- **Loading Spinner**: Displays a loading spinner to indicate processing.

## Technologies & Libraries 🛠️

- **React**: A JavaScript library for building user interfaces. Used for crafting the front-end components.
- **Next.js**: A React framework for server-side rendering and static site generation.
- **Google Cloud Vision API**: An AI-powered image analysis service from Google. It's used for extracting information from images.
- **OpenAI API**: Utilizes GPT models for natural language processing and generation. It's used for creating descriptive text based on image analysis.
- **browser-image-compression**: An NPM package for client-side image compression in the browser. It helps in reducing the size of the images before processing.
- **dotenv**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`. Used for managing API keys and other sensitive information.

## Getting Started 🚀

### Prerequisites

- Node.js
- NPM (Node Package Manager)
- Google Cloud account with access to Vision API
- OpenAI API access

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install the dependencies
4. Create a `.env.local` file in the project root and set your Google Cloud and OpenAI API keys.
5. Start the development server
6. Open your web browser and navigate to `http://localhost:3000`.

## Acknowledgments 🙏

- Google Cloud Vision API
- OpenAI GPT
- Next.js
- React
