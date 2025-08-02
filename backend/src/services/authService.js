const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');

const prisma = new PrismaClient();

class AuthService {
  // Valider une adresse Ethereum
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  async login(address) {
    try {
      console.log(`🔐 Tentative de connexion pour: ${address}`);
      
      // Vérifier si l'utilisateur existe
      let user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      });

      // Créer l'utilisateur s'il n'existe pas
      if (!user) {
        console.log(`👤 Création nouvel utilisateur: ${address}`);
        user = await prisma.user.create({
          data: {
            address: address.toLowerCase(),
            name: `User_${address.slice(-6)}`,
            isVerified: false
          }
        });
      }

      // Supprimer les anciennes sessions de cet utilisateur
      await prisma.userSession.deleteMany({
        where: { userId: user.id }
      });

      // Générer un nouveau token unique
      const tokenPayload = {
        userId: user.id,
        address: user.address,
        timestamp: Date.now(),
        random: Math.random().toString(36)
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default-secret', {
        expiresIn: '24h'
      });

      // Créer une nouvelle session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          isActive: true
        }
      });

      console.log(`✅ Connexion réussie pour: ${address}`);

      return {
        success: true,
        user: {
          id: user.id,
          address: user.address,
          name: user.name,
          isVerified: user.isVerified
        },
        token,
        expiresAt
      };

    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      // Vérifier le JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      // Vérifier que la session existe et est active
      const session = await prisma.userSession.findFirst({
        where: {
          token,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new Error('Session invalide ou expirée');
      }

      return {
        valid: true,
        user: session.user
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async logout(token) {
    try {
      await prisma.userSession.updateMany({
        where: { token },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur logout:', error);
      throw error;
    }
  }

  async updateProfile(userId, profileData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: profileData
      });

      return {
        success: true,
        user: {
          id: user.id,
          address: user.address,
          name: user.name,
          isVerified: user.isVerified
        }
      };
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      throw error;
    }
  }

  async createSession(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h d'expiration

      const session = await prisma.userSession.create({
        data: {
          userId,
          token,
          expiresAt,
          isActive: true
        }
      });

      return session;
    } catch (error) {
      console.error('❌ Erreur création session:', error);
      throw error;
    }
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = new AuthService();
