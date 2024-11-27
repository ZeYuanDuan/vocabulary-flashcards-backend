# Vocabulary Flashcards

![Project icon](assets/images/VOC.png)

Vocabulary management application fetching daily words, enabling custom tagging and organization.

## Table of Contents

- [Introduction](#introduction)
- [Technical Highlights](#technical-highlights)
- [Demo](#demo)
- [Setup and Installation](#setup-and-installation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Team Members](#team-members)
- [License](#license)

## Introduction

Need a better way to learn new vocabulary? Vocabulary Flashcards provides a simple solution.

Get daily word recommendations to expand your vocabulary effortlessly. Save the words you want to learn, organize them with custom tags, and review them anytime to reinforce your memory.

## Technical Highlights

### Tech Stack

- **Languages and Frameworks**: Node.js, Express.js

- **Authentication**: Passport.js, JWT, Google OAuth 2.0

- **DBMS and ORM**: MySQL, Sequelize, Redis

- **Deployment and Hosting**: Render, Clever Cloud

- **Testing**: Postman

### **1. RESTful API and Testing**

- Developed **RESTful API** with complete **CRUD** functionality for seamless front-end integration.

- Automated API validation using **Postman** scripts to ensure correctness and stability.

### **2. Authentication**

- Implemented user authentication with **Passport.js**, supporting:

- **Local Authentication**: Verifies user credentials via the database.

- **Google OAuth 2.0**: Uses third-party authentication.

- Both methods issue a **JWT** for session management.

### **3. API Integration**

- Integrated **Wordnik API** to fetch daily vocabulary with explanations and examples.

- Used **Google Translate API** for translating example sentences into Chinese, aiding comprehension.

### **4. Caching Mechanism**

- Implemented **Redis** with a **Cache-Aside Pattern** for efficient data reads and writes:

- **Read-Through**: Data is directly returned from the cache when available; if not, it is fetched from the database and then cached.

- **Write-Around**: After updating the database, the corresponding cache is immediately invalidated to ensure data consistency.

### **5. Data Relationships**

- Used **Sequelize ORM** to manage **MySQL** interactions and implement many-to-many relationships:

- **Users and Tags**: Independent tag creation and management per user.

- **Vocabulary and Tags**: Dynamic grouping of vocabulary under user-defined tags.

- Simplified relationship handling with Sequelize's built-in associations and query methods.

### **6. Task Automation**

- Scheduled daily vocabulary updates using **CronJobs** for consistent content refresh.

### **7. Front-End and Back-End Separation**

- Implemented a **front-end and back-end separation architecture**:

- Enabled communication via RESTful APIs, ensuring modularity and ease of maintenance.

### **8. Architecture**

- Applied a modified **MVC Architecture** tailored for a front-end and back-end separation:

### **9. Deployment Workflow**

- Deployed back-end on **Render**, with automatic builds triggered by GitHub pushes, enabling basic CI/CD and rapid testing.

- Hosted MySQL on **Clever Cloud**, ensuring stable database connections despite Render's limitations.

### **10. Development Tools**

- Used **MySQL Workbench** for schema design and SQL queries.

- Leveraged **Redis Insight** for cache inspection and management during development.

## Demo

## Setup and Installation

### **Prerequisites**

- Node.js
- MySQL
- Redis

### Step 1. Clone the Repository

```bash
git clone https://github.com/ZeYuanDuan/vocabulary-flashcards-backend.git
cd vocabulary-flashcards-backend
```

### Step 2. Install Dependencies

```bash
npm install
```

### Step 3. Set Up Environment Variables

```
# Application
JWT_SECRET
PORT
ALLOWED_ORIGINS

# Database
DB_USERNAME
DB_PASSWORD
DB_NAME
DB_HOST

# Redis
REDIS_PASSWORD
REDIS_HOST
REDIS_PORT

# Google OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL

# API Key
GOOGLE_TRANSLATION_KEY
WORDNIK_KEY
```

### Step 4. Initialize Database

```bash
npm run init
```

### Step 5. Start the Server

```bash
# Development
npm run dev
# Production
npm run start
```

### Test Account

The initial data includes a test account:

- Email: linguini.remy@ratatouille.com
- Password: ratatouille123

## Database Schema

![Database EER Diagram](assets/images/EER%20Diagram.png)

_Entity-Relationship Diagram showing the database structure_

## API Documentation

All API endpoints have the base path `/api/v1`.

### 1. Local User Login

- **Method**: POST

- **URL**: `{{base_url}}/auth/local`

- **Description**: Used for local user login.

**Request Example**:

```json
{
  "email": "linguini.remy@ratatouille.com",

  "password": "ratatouille123"
}
```

---

### 2. Google User Login

- **Method**: POST

- **URL**: `{{base_url}}/auth/google`

- **Description**: Login via Google third-party application.

---

### 3. Get User Homepage Data

- **Method**: GET

- **URL**: `{{base_url}}/users/stats`

- **Description**:

- Returns the user's name and the number of vocabulary items stored.

- Requires `Authorization` Bearer Token.

**Response Example**:

```json
{
  "name": "Linguini Remy",

  "vocStorage": 2
}
```

---

### 4. Get Vocabulary Data

- **Method**: GET

- **URL**: `{{base_url}}/vocabularies`

- **Description**: Retrieve vocabulary items along with their associated tags.

**Response Example**:

```json
{
  "status": "success",
  "data": [
    {
      "tagId": 1,
      "name": "French Cuisine",
      "vocabularies": [
        {
          "vocId": 1,
          "english": "cheese",
          "chinese": "乳酪",
          "definition": "A food made from the pressed curds of milk.",
          "example": "Cheese is a great source of calcium."
        }
      ]
    }
  ]
}
```

---

### 5. Get Daily Vocabularies

- **Method**: GET

- **URL**: `{{base_url}}/public/daily-vocabularies`

- **Description**:

- Automatically updates with 20 random words every midnight.

- No authentication required.

---

### 6. Add Vocabulary

- **Method**: POST

- **URL**: `{{base_url}}/vocabularies`

- **Description**:

- Add a new vocabulary item.

- The `english` field is required, while others are optional.

**Request Example**:

```json
{
  "english": "wine",

  "chinese": "葡萄酒",

  "definition": "An alcoholic drink made from fermented grapes.",

  "example": "Wine is often paired with cheese in French cuisine.",

  "tags": ["French Cuisine", "Beverages"]
}
```

---

### 7. Update Vocabulary

- **Method**: PATCH

- **URL**: `{{base_url}}/vocabularies/{{vocabularyId}}`

- **Description**: Update vocabulary data for a specific ID.

---

### 8. Delete Vocabulary

- **Method**: DELETE

- **URL**: `{{base_url}}/vocabularies/{{vocabularyId}}`

- **Description**:

- Delete a specific vocabulary item.

- The response includes the total number of remaining vocabulary items.

## Team Members

This project was collaboratively developed by

- **Back-End Developer**: [Ze-Yuan Duan](https://github.com/ZeYuanDuan)

- **Front-End Developer**: [Benson Wu](https://github.com/dan00815)

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/), permitting unrestricted use, modification, and distribution for both personal and commercial purposes.
