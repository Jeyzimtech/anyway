# AEM Supplies - Retail Management System

A comprehensive retail management system built with React and Node.js, designed to streamline sales operations, inventory management, and employee management for retail businesses.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Features

### Core Features

- **User Authentication & Authorization**
  - Secure login/signup with email validation
  - Password strength requirements (capital letter, number, special character, 6+ characters)
  - Password reset functionality
  - Role-based access control (Admin/Employee)

- **Sales Management**
  - Point-of-sale interface for creating orders
  - Real-time inventory tracking
  - Discount and coupon application
  - Order history and tracking

- **Product Management** (Admin Only)
  - Add, edit, and delete products
  - Category management
  - Barcode support
  - Stock level tracking

- **Inventory Management** (Admin Only)
  - Real-time inventory monitoring
  - Stock threshold alerts (Low/Critical)
  - Product list management
  - Inventory analytics

- **Order Management**
  - Create and view orders
  - Order status tracking
  - Return request management
  - Order analytics

- **Promotions** (Admin Only)
  - Discount creation and management with date ranges
  - Overlap validation to prevent conflicting discounts
  - Coupon generation for WiFi access
  - Promotional analytics

- **User Management** (Admin Only)
  - User approval workflow
  - Activity logging and session history
  - Password reset requests
  - Real-time user activity tracking

- **Analytics & Reporting**
  - Sales trends and analysis
  - Revenue and profit tracking
  - Category insights
  - Product performance analysis
  - Inventory analytics
  - Expense tracking

- **Settings**
  - Store configuration
  - Stock threshold settings (Low/Critical)
  - System preferences
  - Notification settings

## Tech Stack

### Frontend
- **React** 18.2.0
- **TypeScript** 5.1.6
- **Tailwind CSS** 3.4.17
- **React Router** for navigation
- **Shadcn UI** component library
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MySQL** 2/promise for database
- **bcryptjs** for password hashing
- **JWT** for authentication
- **CORS** for cross-origin requests

### Tools & Services
- **dotenv** for environment variables
- **Concurrently** for running frontend and backend together

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL database (v5.7 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aem-supplies
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a MySQL database named `salespark`
   - Run the schema file to set up tables:
     ```bash
     mysql -u root -p salespark < server/schema.sql
     ```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
SERVER_PORT=4000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=salespark

# Frontend Configuration
REACT_APP_API_BASE=http://localhost:4000/api
```

## Running the Application

### Development Mode

Start both frontend and backend concurrently:

```bash
npm start
```

This will:
- Start the backend server on `http://localhost:4000`
- Start the frontend on `http://localhost:3002`

### Individual Commands

**Start backend only:**
```bash
npm run server
```

**Start frontend only:**
```bash
npm run frontend
```

**Build for production:**
```bash
npm run build
```

### Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:4000/api
- **API Health Check**: http://localhost:4000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/analytics/trends` - Sales trends
- `GET /api/orders/analytics/profitability` - Profit analysis
- `GET /api/orders/analytics/inventory` - Inventory analytics

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/activity` - User activity logs
- `POST /api/users/activity/login` - Log user login
- `POST /api/users/activity/logout` - Log user logout
- `POST /api/users/change-password` - Change user password

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings/stock-thresholds` - Update stock thresholds (Admin only)
- `PUT /api/settings` - Update system settings (Admin only)

### Returns
- `GET /api/returns` - List returns
- `POST /api/returns` - Create return request
- `PUT /api/returns/:id` - Update return status (Admin only)

### Discounts
- `GET /api/discounts` - List discounts (Admin only)
- `POST /api/discounts` - Create discount (Admin only)
- `DELETE /api/discounts/:id` - Delete discount (Admin only)

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **profiles** - Extended user information
- **products** - Product catalog
- **orders** - Customer orders
- **order_items** - Individual items in orders
- **returns** - Product returns
- **user_activity** - User login/logout tracking
- **password_resets** - Password reset requests
- **settings** - System configuration
- **discounts** - Promotional discounts

## User Roles and Permissions

### Admin Access
- Dashboard with analytics
- Product management (CRUD)
- Inventory management
- User management and approvals
- Order management
- Returns management
- Promotions (Discounts & Coupons)
- Settings configuration
- Sales analysis and reporting

### Employee Access
- Sales/Point-of-Sale interface
- View orders
- Process returns
- View profile
- Change password
- Coupons view

## Project Structure

```
aem-supplies/
├── public/                 # Static assets
├── server/                 # Backend
│   ├── routes/            # API route handlers
│   │   ├── auth.js       # Authentication routes
│   │   ├── products.js   # Product management
│   │   ├── orders.js     # Order management
│   │   ├── users.js      # User management
│   │   ├── returns.js    # Returns management
│   │   ├── settings.js   # Settings routes
│   │   └── employees.js  # Employee routes
│   ├── db.js             # Database connection
│   ├── index.js          # Express server setup
│   └── schema.sql        # Database schema
├── src/                   # Frontend
│   ├── components/       # Reusable React components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── Header.tsx   # Top navigation
│   │   ├── AppSidebar.tsx # Side navigation
│   │   ├── MainLayout.tsx # Main layout wrapper
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── contexts/         # React context (Auth)
│   ├── pages/           # Page components
│   │   ├── Login.js     # Authentication page
│   │   ├── Dashboard.tsx # Admin dashboard
│   │   ├── Sales.tsx    # POS interface
│   │   ├── Orders.tsx   # Order management
│   │   ├── Users.tsx    # User management
│   │   ├── Profile.tsx  # User profile
│   │   └── ...
│   ├── lib/             # Utilities
│   │   └── api.js      # API client functions
│   ├── styles/          # CSS files
│   ├── App.js          # Main app component
│   └── index.js        # React entry point
├── package.json         # Project dependencies
└── README.md           # This file
```

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## Troubleshooting

### White Page Issue
If the application shows a blank white page:
1. Check browser console for errors (F12)
2. Ensure backend is running on port 4000
3. Verify database connection in .env file
4. Clear browser cache and restart the dev server

### Database Connection Error
1. Verify MySQL is running
2. Check .env file credentials
3. Ensure database `salespark` exists
4. Run schema.sql to initialize tables

### Port Already in Use
If ports 3002 or 4000 are already in use:
```bash
# Change port in .env (SERVER_PORT for backend)
# Change port in frontend command: PORT=3003 npm run frontend
```

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.

---

**Last Updated**: December 2025
**Version**: 1.0.0
