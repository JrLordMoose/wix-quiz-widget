# Wix Quiz Widget

A customizable personality quiz widget for Wix sites that provides product recommendations based on user responses.

## Features

- Multi-step personality quiz
- Product recommendations based on quiz results
- Lead capture with email collection
- Customizable styling and content
- Admin dashboard for managing questions and products
- Analytics tracking
- Multi-language support

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Connect to your Wix Blocks project
4. Deploy through Wix Blocks

## Configuration

The widget can be customized through the following properties:

- `primaryColor`: Main theme color
- `quizTitle`: Title of the quiz
- `showEmailField`: Toggle email collection
- `questions`: Array of quiz questions
- `products`: Array of tagged products

## Development

1. Make changes to the source code
2. Test locally using the Wix Blocks preview
3. Push changes to GitHub
4. Sync with Wix Blocks

## Data Structure

### Leads Collection
- email (text, required)
- personalityType (text, required)
- productId (reference)
- quizAnswers (array)
- quizVersion (text)
- sourceSiteId (text)
- createdAt (datetime)
- submitted (boolean)

### Products Collection
- title (text)
- description (text)
- tags (array)
- image (image)
- price (number)

## License

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 