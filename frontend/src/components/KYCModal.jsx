import React, { useState } from 'react';
import { X, Upload, User, Camera, Check, AlertCircle, Lock } from 'lucide-react';

const KYCModal = ({ isOpen, onClose, onComplete, walletAddress, required = false }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    dateOfBirth: '',
    passportImage: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Pays requis';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date de naissance requise';
    }
    if (!formData.passportImage) {
      newErrors.passportImage = 'Photo de passeport requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de l'upload d'image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, passportImage: 'Veuillez sélectionner une image' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setErrors({ ...errors, passportImage: 'Image trop grande (max 5MB)' });
        return;
      }

      setFormData({ ...formData, passportImage: file });
      
      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
      
      // Supprimer l'erreur
      if (errors.passportImage) {
        const newErrors = { ...errors };
        delete newErrors.passportImage;
        setErrors(newErrors);
      }
    }
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Créer FormData pour l'upload
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('country', formData.country);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('passportImage', formData.passportImage);
      submitData.append('address', walletAddress);
      
      // Appel API KYC
      const response = await fetch('http://localhost:3001/api/auth/kyc', {
        method: 'POST',
        body: submitData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStep(3); // Étape succès
        setTimeout(() => {
          onComplete(result.user);
          onClose();
        }, 2000);
      } else {
        setErrors({ general: result.error || 'Erreur lors de la soumission' });
      }
      
    } catch (error) {
      console.error('Erreur KYC:', error);
      setErrors({ general: 'Erreur de connexion au serveur' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              required ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {required ? (
                <Lock className={`w-5 h-5 ${required ? 'text-red-600' : 'text-blue-600'}`} />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {required ? 'Vérification KYC Obligatoire' : 'Vérification KYC'}
              </h2>
              <p className="text-sm text-gray-600">Étape {step}/3</p>
            </div>
          </div>
          
          {/* Bouton fermer seulement si pas obligatoire */}
          {!required && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Avertissement si obligatoire */}
        {required && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-800">
              La vérification KYC est obligatoire pour accéder à la plateforme financière.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="px-6 py-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                required ? 'bg-red-600' : 'bg-blue-600'
              }`}
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Information personnelle */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
            <p className="text-sm text-gray-600">
              Veuillez fournir vos informations personnelles pour la vérification.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre prénom"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre nom"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays *
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez votre pays</option>
                <option value="FR">France</option>
                <option value="SN">Sénégal</option>
                <option value="US">États-Unis</option>
                <option value="CA">Canada</option>
                <option value="UK">Royaume-Uni</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
              </select>
              {errors.country && (
                <p className="text-xs text-red-500 mt-1">{errors.country}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Upload photo */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Photo de passeport</h3>
            <p className="text-sm text-gray-600">
              Téléchargez une photo claire de votre passeport ou pièce d'identité.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              {previewImage ? (
                <div className="space-y-4">
                  <img
                    src={previewImage}
                    alt="Aperçu passeport"
                    className="max-w-full h-48 object-contain mx-auto rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setFormData({ ...formData, passportImage: null });
                      setPreviewImage(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Supprimer l'image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-800 font-medium">
                        Cliquez pour télécharger
                      </span>
                      <span className="text-gray-600"> ou glissez votre image ici</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG jusqu'à 5MB
                  </p>
                </div>
              )}
            </div>
            
            {errors.passportImage && (
              <p className="text-sm text-red-500">{errors.passportImage}</p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.passportImage || isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? 'Envoi...' : 'Valider KYC'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Succès */}
        {step === 3 && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">KYC Validé !</h3>
            <p className="text-sm text-gray-600">
              Votre vérification a été soumise avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.
            </p>
          </div>
        )}

        {/* Erreurs générales */}
        {errors.general && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCModal;
