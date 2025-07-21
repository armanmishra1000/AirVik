'use client';

import MainLayout from '../src/components/layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to AirVik
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Your premier hotel booking system
        </p>
        
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Find Your Perfect Stay
            </h2>
            <p className="text-gray-600 mb-6">
              Discover amazing hotels, book with confidence, and create unforgettable memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Get Started
              </a>
              <a
                href="/auth/login"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Sign In
              </a>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-600 text-3xl mb-4">🏨</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wide Selection
              </h3>
              <p className="text-gray-600">
                Choose from thousands of hotels worldwide with detailed reviews and photos.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-600 text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure Booking
              </h3>
              <p className="text-gray-600">
                Your personal information and payments are protected with industry-standard security.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-600 text-3xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Best Prices
              </h3>
              <p className="text-gray-600">
                Get the best deals with our price matching guarantee and exclusive offers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
