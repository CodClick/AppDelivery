import React from 'react';

// Adicione logo_url e outras props que você usa no cabeçalho
interface RestaurantHeaderProps {
  nome?: string;
  logo_url?: string;
  // adicione outras props da sua empresa aqui, se necessário
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ nome, logo_url }) => {
  return (
    <div className="relative h-48 sm:h-64 bg-gray-200">
      {logo_url && (
        <img
          src={logo_url}
          alt={`Logo da ${nome}`}
          className="w-full h-full object-cover"
        />
      )}
      <div className="container mx-auto px-4 relative -mt-16 sm:-mt-24 z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-center">
          {logo_url && (
            <img
              src={logo_url}
              alt={`Logo da ${nome}`}
              className="w-24 h-24 rounded-full mr-0 sm:mr-6 mb-4 sm:mb-0 object-cover border-4 border-white"
            />
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{nome}</h1>
            <p className="mt-1 text-gray-600">
              {/* Adicione outras informações como slogan, endereço, etc. */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;
