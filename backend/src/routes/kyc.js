const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Configuration multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.body.address}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// POST /api/auth/kyc - Soumission KYC
router.post('/kyc', upload.single('passportImage'), async (req, res) => {
  try {
    const { firstName, lastName, country, dateOfBirth, address } = req.body;
    const passportImage = req.file;

    console.log('📝 Soumission KYC pour:', address);
    console.log('📋 Données:', { firstName, lastName, country, dateOfBirth });
    console.log('📸 Image:', passportImage ? passportImage.filename : 'Aucune');

    // Validation des données requises
    if (!firstName || !lastName || !country || !dateOfBirth || !address) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    if (!passportImage) {
      return res.status(400).json({
        success: false,
        error: 'Photo de passeport requise'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() }
    });

    const userData = {
      address: address.toLowerCase(),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      country,
      dateOfBirth: new Date(dateOfBirth),
      passportImage: passportImage.filename,
      isVerified: true // Auto-validation pour demo
    };

    if (user) {
      // Mettre à jour l'utilisateur existant
      user = await prisma.user.update({
        where: { id: user.id },
        data: userData
      });
      console.log('✅ Utilisateur KYC mis à jour:', user.id);
    } else {
      // Créer nouvel utilisateur
      user = await prisma.user.create({
        data: userData
      });
      console.log('✅ Nouvel utilisateur KYC créé:', user.id);
    }

    res.json({
      success: true,
      message: 'KYC soumis avec succès',
      user: {
        id: user.id,
        address: user.address,
        name: user.name,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('❌ Erreur KYC:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur suppression fichier:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la soumission KYC'
    });
  }
});

// GET /api/auth/kyc-status/:address - Vérifier le statut KYC
router.get('/kyc-status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      select: {
        id: true,
        address: true,
        name: true,
        isVerified: true,
        firstName: true,
        lastName: true,
        country: true
      }
    });

    if (user) {
      res.json({
        success: true,
        user,
        kycCompleted: user.isVerified
      });
    } else {
      res.json({
        success: true,
        user: null,
        kycCompleted: false
      });
    }

  } catch (error) {
    console.error('❌ Erreur vérification KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du statut KYC'
    });
  }
});

module.exports = router;
