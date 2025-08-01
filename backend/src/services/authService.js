const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpire = process.env.JWT_EXPIRE || '24h';
  }

  // Générer un token JWT
  generateToken(userId, address) {
    return jwt.sign(
      { 
        userId, 
        address,
        timestamp: Date.now()
      }, 
      this.jwtSecret, 
      { expiresIn: this.jwtExpire }
    );
  }

  // Vérifier un token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Créer ou trouver un utilisateur par adresse Ethereum
  async findOrCreateUser(address, userData = {}) {
    try {
      // Vérifier si l'utilisateur existe déjà
      let user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      });

      if (!user) {
        // Créer un nouvel utilisateur
        user = await prisma.user.create({
          data: {
            address: address.toLowerCase(),
            name: userData.name || `User_${address.slice(0, 8)}`,
            email: userData.email || null,
            firstName: userData.firstName || null,
            lastName: userData.lastName || null,
            country: userData.country || null
          }
        });

        console.log(`✅ New user created: ${user.address}`);
      } else {
        // Mettre à jour lastLogin
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }

      return user;
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  // Créer une session utilisateur
  async createSession(userId, token, metadata = {}) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h d'expiration

      const session = await prisma.userSession.create({
        data: {
          userId,
          token,
          expiresAt,
          userAgent: metadata.userAgent || null,
          ipAddress: metadata.ipAddress || null
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Valider une session
  async validateSession(token) {
    try {
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session');
      }

      return session;
    } catch (error) {
      console.error('Error validating session:', error);
      throw error;
    }
  }

  // Déconnexion (invalider session)
  async logout(token) {
    try {
      await prisma.userSession.update({
        where: { token },
        data: { isActive: false }
      });

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  // Nettoyer les sessions expirées
  async cleanExpiredSessions() {
    try {
      const result = await prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false }
          ]
        }
      });

      console.log(`🧹 Cleaned ${result.count} expired sessions`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
      throw error;
    }
  }

  // Obtenir les informations utilisateur par token
  async getUserByToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          address: true,
          name: true,
          email: true,
          isVerified: true,
          role: true,
          createdAt: true,
          lastLogin: true,
          firstName: true,
          lastName: true,
          country: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error getting user by token:', error);
      throw error;
    }
  }

  // Mettre à jour le profil utilisateur
  async updateUserProfile(userId, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          address: true,
          name: true,
          email: true,
          isVerified: true,
          firstName: true,
          lastName: true,
          country: true,
          passportImage: true
        }
      });

      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Vérifier si une adresse Ethereum est valide
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

const authService = new AuthService();
module.exports = authService;
