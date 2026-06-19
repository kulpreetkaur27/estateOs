import React from 'react';
import Navbar from './Navbar'; 
import { FaHome, FaRegComments, FaUsers, FaBullhorn } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
    const navigate = useNavigate();

    const handleJoinUsClick = () => {
        navigate('/login');
    };
    return (
        <>
        {/* Navbar */}
        <Navbar />

        {/* Banner Section with Image */}
        <div className="relative py-24 px-6 sm:px-12 mt-16 bg-gradient-to-r from-indigo-100 via-purple-100 to-blue-100">
        <div className="max-w-7xl mx-auto text-center">
          
          {/* Banner Image */}
          <div className="relative">
            <img
              src="about-us-banner.jpg" 
              alt="About Us Banner"
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Text Content */}
          <div className="mt-8">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-indigo-900 mb-4">
              About Us
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 mb-6">
              We are a dedicated team of real estate professionals committed to helping you find your perfect property.
            </p>
            <div>
              {/* Join Us Button with Navigation to Login Page */}
              <button
                onClick={handleJoinUsClick}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700"
              >
                Join Us
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* About Us Content Section */}
         {/* Who We Are Section  */}
         <div className="relative py-16 px-6 sm:px-12 bg-gradient-to-r from-indigo-200 via-purple-200 to-blue-200">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative">
            <div className="w-full md:w-1/2 rounded-lg overflow-hidden">
                <img
                src="who-we-are.jpg" 
                alt="About Us Image"
                className="w-full h-full object-cover"
                />
            </div>


            <div className="w-full md:w-1/2 space-y-8 text-center md:text-left absolute md:relative top-1/3 transform md:top-0 -translate-y-1/6 md:translate-y-0">
                <div className="bg-black text-white p-8 rounded-lg shadow-lg opacity-90 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                    Who We Are
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                    At Apex Real Estate, we are passionate about helping you find your dream property. Whether you are looking to buy, sell, or rent, our expert team is here to guide you every step of the way. With years of experience, we’ve earned the trust of clients across the region and are committed to making your real estate journey smooth and successful.
                </p>
                <div className="text-center md:text-left my-4">
                <button
                    onClick={handleJoinUsClick}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-indigo-700"
                >
                    Join Us
                </button>
                </div>
                </div>
            </div>
            </div>
        </div>



        {/* What We Offer - Services with Icons */}
        <div className="py-16 px-6 sm:px-12 bg-gray-100">
            <div className="max-w-7xl mx-auto space-y-12">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 animate__animated animate__fadeIn animate__delay-3s">
                What We Offer
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {/* Real Estate Experts Tile */}
                <div className="group bg-white p-8 rounded-lg shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white text-center animate__animated animate__fadeIn animate__delay-4s">
                <FaHome className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Real Estate Experts</h4>
                <p className="text-lg">Our team consists of industry experts ready to guide you in buying, selling, or renting your next property.</p>
                </div>

                {/* Testimonials Tile */}
                <div className="group bg-white p-8 rounded-lg shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white text-center animate__animated animate__fadeIn animate__delay-5s">
                <FaRegComments className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Client Testimonials</h4>
                <p className="text-lg">See what our clients have to say about their experiences with our professional real estate team.</p>
                </div>

                {/* Client Success Tile */}
                <div className="group bg-white p-8 rounded-lg shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white text-center animate__animated animate__fadeIn animate__delay-6s">
                <FaUsers className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Client Success Stories</h4>
                <p className="text-lg">Explore how we've helped countless clients achieve their real estate goals and dreams.</p>
                </div>
            </div>
            </div>
        </div>

        {/* Core Values Section with Icons and Hover Animations */}
        <div className="py-16 px-6 sm:px-12">
            <div className="max-w-7xl mx-auto space-y-12">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 animate__animated animate__fadeIn animate__delay-3s">
                Our Core Values
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {/* Value 1 */}
                <div className="group bg-white p-8 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white hover:rotate-2 animate__animated animate__fadeIn animate__delay-4s">
                <FaBullhorn className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Transparency</h4>
                <p className="text-lg">We believe in clear, open communication, keeping you informed at every step of your journey with us.</p>
                </div>

                {/* Value 2 */}
                <div className="group bg-white p-8 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white hover:rotate-2 animate__animated animate__fadeIn animate__delay-5s">
                <FaUsers className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Client-Centric</h4>
                <p className="text-lg">Our clients are at the heart of everything we do. We ensure your needs are always our priority.</p>
                </div>

                {/* Value 3 */}
                <div className="group bg-white p-8 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white hover:rotate-2 animate__animated animate__fadeIn animate__delay-6s">
                <FaHome className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Integrity</h4>
                <p className="text-lg">We maintain honesty and integrity in every deal, ensuring trust and reliability in all of our relationships.</p>
                </div>

                {/* Value 4 */}
                <div className="group bg-white p-8 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-indigo-600 hover:text-white hover:rotate-2 animate__animated animate__fadeIn animate__delay-7s">
                <FaRegComments className="text-4xl mb-4 text-indigo-600 group-hover:text-white transition-all duration-300" />
                <h4 className="text-xl font-bold mb-4">Excellence</h4>
                <p className="text-lg">We strive for excellence in everything we do, aiming to exceed expectations and deliver outstanding service.</p>
                </div>
            </div>
            </div>
        </div>

      {/* Footer Section with Pink Background */}
        <div className="bg-purple-500 text-white py-6 text-center">
        <p>© 2025 Apex Real Estate. All rights reserved.</p>
        </div>

        </>
    );
};

export default AboutUs;
