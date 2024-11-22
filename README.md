#  Vocabulary Flashcards
Vocabulary management application fetching daily words, enabling custom tagging and organization.

## Introduction


## Technical Highlights
### Tech Stack
-   **Languages and Frameworks**: Node.js, Express.js
-   **Authentication**: Passport.js, JWT, Google OAuth 2.0
-   **DBMS and ORM**: MySQL, Sequelize, Redis
-   **Deployment and Hosting**: Render, Clever Cloud
-   **Testing**: Postman

### **1. RESTful API and Testing**

-   Developed **RESTful API** with complete **CRUD** functionality for seamless front-end integration.
-   Automated API validation using  **Postman**  scripts to ensure correctness and stability.

### **2.  Authentication**

-   Implemented user authentication with  **Passport.js**, supporting:
    -   **Local Authentication**: Verifies user credentials via the database.
    -   **Google OAuth 2.0**: Uses third-party authentication.
-   Both methods issue a  **JWT**  for session management.

### **3.  API Integration**

-   Integrated  **Wordnik API**  to fetch daily vocabulary with explanations and examples.
-   Used  **Google Translate API**  for translating example sentences into Chinese, aiding comprehension.

### **4. Caching Mechanism**

-   Implemented  **Redis**  with a  **Cache-Aside Pattern**  for efficient data reads and writes:
    -   **Read-Through**: Data is directly returned from the cache when available; if not, it is fetched from the database and then cached.
    -   **Write-Around**: After updating the database, the corresponding cache is immediately invalidated to ensure data consistency.

### **5. Data Relationships**

-   Used  **Sequelize ORM**  to manage MySQL interactions and implement many-to-many relationships:
    -   **Users and Tags**: Independent tag creation and management per user.
    -   **Vocabulary and Tags**: Dynamic grouping of vocabulary under user-defined tags.
-   Simplified relationship handling with Sequelize's built-in associations and query methods.

### **6. Task Automation**

-   Scheduled daily vocabulary updates using  **CronJobs**  for consistent content refresh.

### **7. Front-End and Back-End Separation**

-   Implemented a  **front-end and back-end separation architecture**:
-   Enabled communication via RESTful APIs, ensuring modularity and ease of maintenance.

### **8. Architecture**

-   Applied a modified  **MVC Architecture**  tailored for a front-end and back-end separation:

### **9. Deployment Workflow**

-   Deployed back-end on  **Render**, with automatic builds triggered by GitHub pushes, enabling basic CI/CD and rapid testing.
-   Hosted MySQL on  **Clever Cloud**, ensuring stable database connections despite Render's limitations.

### **10. Development Tools**

-   Used  **MySQL Workbench**  for schema design and SQL queries.
-   Leveraged  **Redis Insight**  for cache inspection and management during development.

## Demo

## Setup and Installation

## Database Schema

## API Documentation

## Team Members

## License