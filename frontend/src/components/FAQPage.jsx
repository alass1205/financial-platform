import React from 'react';

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Questions Fréquemment Posées
            </h1>
            <p className="text-xl text-gray-600">
              Guide de la plateforme de trading financier
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Comment utiliser la plateforme ?
          </h3>
          <p className="text-gray-700">
            Connectez votre wallet, visitez les pages Assets pour trader.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Quels assets sont disponibles ?
          </h3>
          <p className="text-gray-700">
            CLV (10 TRG), ROO (10 TRG), GOV (200 TRG)
          </p>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pages des Assets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-blue-600">CLV</div>
              <div className="text-sm text-gray-600">Clove Company</div>
              <div className="text-sm text-gray-500 mt-1">10 TRG</div>
            </div>
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-blue-600">ROO</div>
              <div className="text-sm text-gray-600">Rooibos Limited</div>
              <div className="text-sm text-gray-500 mt-1">10 TRG</div>
            </div>
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-blue-600">GOV</div>
              <div className="text-sm text-gray-600">Government Bonds</div>
              <div className="text-sm text-gray-500 mt-1">200 TRG</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
