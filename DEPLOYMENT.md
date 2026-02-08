# Deployment Guide

## Project Structure
- **Frontend**: React application in `/frontend` directory
- **Backend**: FastAPI application in `/backend` directory

## Environment Variables

### Backend (.env)
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=erp_robot_vacuum
JWT_SECRET=your_secret_key
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=your_backend_url
```

## Deployment Steps

### 1. Build Frontend
```bash
npm install
npm run build
```

### 2. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Backend
```bash
npm run backend:prod
```

The backend will start on port 8000.

## Development

### Start Frontend
```bash
npm run dev
```

### Start Backend
```bash
npm run backend
```

## Production Deployment

The application uses:
- **Procfile**: Defines the backend web process
- **runtime.txt**: Specifies Python version
- **requirements.txt**: Python dependencies
- **package.json**: Node.js dependencies and build scripts

### Heroku/Similar Platforms
The app will automatically:
1. Install Python dependencies from `requirements.txt`
2. Install Node.js dependencies via `postinstall` script
3. Build frontend via `npm run build`
4. Start backend via Procfile

### Environment Variables to Set
- MONGO_URL
- DB_NAME
- JWT_SECRET
- PORT (auto-set by platform)
