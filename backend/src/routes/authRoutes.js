const express = require('express');
const multer = require('multer');
const path = require('path');
const authService = require('../services/authService');
const web3Service = require('../services/web3Service');

const router = express.Router();

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/passports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'passport-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const user = await authService.getUserByToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', message: error.message });
  }
};

// Route de connexion/inscription avec adresse Ethereum
router.post('/login', async (req, res) => {
  try {
    const { address, signature, message, userData } = req.body;

    // Validation de l'adresse
    if (!address || !authService.isValidAddress(address)) {
      return res.status(400).json({ error: 'Valid Ethereum address required' });
    }

    // TODO: Vérifier la signature (pour l'instant on fait confiance)
    // const isValidSignature = web3Service.verifySignature(message, signature, address);
    // if (!isValidSignature) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Créer ou trouver l'utilisateur
    const user = await authService.findOrCreateUser(address, userData);

    // Générer le token JWT
    const token = authService.generateToken(user.id, user.address);

    // Créer la session
    await authService.createSession(user.id, token, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    res.json({
      status: 'OK',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        address: user.address,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: error.message 
    });
  }
});

// Route de déconnexion
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    await authService.logout(token);

    res.json({
      status: 'OK',
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed', 
      message: error.message 
    });
  }
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      status: 'OK',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ 
      error: 'Failed to get user information', 
      message: error.message 
    });
  }
});

// Route pour mettre à jour le profil
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, firstName, lastName, country, dateOfBirth } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (country) updateData.country = country;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

    const updatedUser = await authService.updateUserProfile(req.user.id, updateData);

    res.json({
      status: 'OK',
      message: 'Profile updated successfully',
      user: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile', 
      message: error.message 
    });
  }
});

// Route pour upload du passeport
router.post('/upload-passport', authenticate, upload.single('passport'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Mettre à jour le chemin du passeport dans la DB
    const updatedUser = await authService.updateUserProfile(req.user.id, {
      passportImage: req.file.path
    });

    res.json({
      status: 'OK',
      message: 'Passport uploaded successfully',
      filename: req.file.filename,
      path: req.file.path,
      user: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Passport upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload passport', 
      message: error.message 
    });
  }
});

// Route pour lister tous les utilisateurs (admin seulement)
router.get('/users', authenticate, async (req, res) => {
  try {
    // TODO: Vérifier le rôle admin
    // if (req.user.role !== 'ADMIN') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        address: true,
        name: true,
        email: true,
        isVerified: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        country: true
      },
      orderBy: { createdAt: 'desc' }
    });

    await prisma.$disconnect();

    res.json({
      status: 'OK',
      users,
      total: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users', 
      message: error.message 
    });
  }
});

// Route de test pour vérifier l'auth
router.get('/test', authenticate, (req, res) => {
  res.json({
    status: 'OK',
    message: 'Authentication working correctly',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Nettoyage des sessions expirées (cron job)
router.post('/cleanup-sessions', async (req, res) => {
  try {
    const cleaned = await authService.cleanExpiredSessions();
    res.json({
      status: 'OK',
      message: `Cleaned ${cleaned} expired sessions`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to cleanup sessions', 
      message: error.message 
    });
  }
});

module.exports = router;
