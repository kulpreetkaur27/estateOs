import React from 'react';
import Navbar from './Navbar';  // Import Navbar component

const ContactUs = () => {
  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-600 text-white py-16 px-4 sm:px-6 lg:px-8 mt-24">
        <div className="max-w-7xl w-full space-y-12 mx-auto">
          {/* Title Section */}
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 animate__animated animate__fadeInUp">
              Contact Us
            </h2>
            <p className="text-lg sm:text-xl text-gray-200">
              We are here to assist you. Reach out to us for any inquiries, support, or feedback. Let's connect!
            </p>
          </div>

          {/* Contact Information Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 animate__animated animate__fadeIn animate__delay-1s">
            {/* Left Section: Contact Details */}
            <div className="space-y-8">
              <div className="flex items-center text-lg sm:text-xl font-semibold">
                <span className="mr-4 text-teal-200">📍</span>
                <p>123 Real Estate Street, Suite 45, City, Country</p>
              </div>
              <div className="flex items-center text-lg sm:text-xl font-semibold">
                <span className="mr-4 text-teal-200">📞</span>
                <p>+1 (555) 123-4567</p>
              </div>
              <div className="flex items-center text-lg sm:text-xl font-semibold">
                <span className="mr-4 text-teal-200">📧</span>
                <p>support@example.com</p>
              </div>
              <div className="flex items-center text-lg sm:text-xl font-semibold">
                <span className="mr-4 text-teal-200">⏰</span>
                <p>
                  Monday - Friday: 9 AM - 6 PM <br />
                  Saturday: 10 AM - 4 PM <br />
                  Sunday: Closed
                </p>
              </div>
            </div>

            {/* Right Section: Map Integration */}
            <div className="space-y-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">Find Us on the Map</h3>
              <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.134149891469!2d-122.40071408467829!3d37.7851341797564!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808cce50f49b%3A0x9835c8edca7a5090!2sReal%20Estate%20Company!5e0!3m2!1sen!2sus!4v1617031419200!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Google Map Location"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="flex justify-center gap-6 mt-12 animate__animated animate__fadeIn animate__delay-2s">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook-square text-3xl text-white hover:text-blue-600 transition-all duration-300"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter-square text-3xl text-white hover:text-blue-400 transition-all duration-300"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-linkedin text-3xl text-white hover:text-blue-700 transition-all duration-300"></i>
            </a>
          </div>

          {/* Footer Section */}
          <div className="text-center mt-12 text-gray-200">
            <p>© 2025 Real Estate Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
