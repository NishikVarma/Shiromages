# Shiromages - Personal Photo Gallery

A secure, personal photo gallery application built with the MERN stack and AWS. It provides private galleries per user, image upload/download, search by filename or AI-generated tags, and optional integration with AWS Rekognition for automated tagging.

## Quick Start

```bash
# 1. Clone & Setup Backend
cd backend
npm install
# Create and populate backend/.env

# 2. Setup Frontend (in a new terminal)
cd frontend
npm install

# 3. Run Both Servers
# (In backend terminal)
npm start
# (In frontend terminal)
npm start
```

## Key Features

- User authentication (JWT) with registration and login flows
- Private galleries: user files stored separately in S3 for isolation
- Image CRUD: upload, list, view, search, and delete images
- Bulk uploads with progress tracking (concurrent uploads)
- Full-screen responsive image viewer (modal)
- AI-based tagging via AWS Rekognition (optional; disabled by default)

## Tech Stack

| Category      | Technology               |
|---------------|--------------------------|
| Frontend      | React                    |
| Backend       | Node.js, Express.js      |
| Database      | MongoDB (Mongoose)       |
| File Storage  | AWS S3                   |
| Image AI      | AWS Rekognition          |

## Project Structure

.
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── context/
        ├── features/
        ├── pages/
        ├── App.js
        └── index.js

## Local Development

### Prerequisites

- Node.js and npm 
- AWS account with an S3 bucket and an IAM user
- MongoDB Atlas account

### 1) Backend

Open a Bash terminal and run:

```bash
# go to backend
cd backend

# install dependencies
npm install

# create a .env file (see example below)

# start the server
npm start
```

The backend will run on the port defined by `PORT` in `backend/.env` (default 5000).

### 2) Frontend

In a separate Bash terminal run:

```bash
# go to frontend
cd frontend

# install dependencies
npm install

# start React dev server
npm start
```

The React app should open at <http://localhost:3000> by default.

## Environment Variables

Create a `.env` file in the `backend/` directory and populate these keys:

```properties
# Server
PORT=5000

# Database
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret_string

# AWS
S3_BUCKET=your_s3_bucket_name
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

Notes:

- Keep your `.env` file out of version control.
- Ensure the IAM user has the required S3 permissions (PutObject, GetObject, ListBucket, DeleteObject).

## Deployment

- Backend: Suitable for deployment as a web service on Render, Heroku, AWS Elastic Beanstalk, or similar. (Render in this case)
- Frontend: Deployable to Vercel, Netlify, or any static hosting provider. (Vercel in this case)

## AWS Rekognition

Rekognition can be used to automatically generate tags for images to improve search. This is integrated but can be disabled in your backend code if you don not want to use it.

## Troubleshooting

- If you see an error about `import`/`export` statements, ensure `package.json` in `backend/` contains:

```json
"type": "module"
```

- If S3 operations fail, double-check your AWS credentials and bucket name.

## License & Contributing

Feel free to open issues or submit PRs. Add a license file if you plan to open-source the project.

---
