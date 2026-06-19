import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const BookingConfirmed = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center relative overflow-hidden"
      >
        {/* Glowing Circle Background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-300 opacity-30 rounded-full blur-3xl animate-pulse z-0"></div>

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center mb-6"
          >
            <CheckCircle2 size={60} className="text-green-500" />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-gray-600 text-md mb-4">
            Your appointment has been successfully scheduled.
          </p>

          <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700 shadow-inner mb-6">
            <p>
              <strong>Booking ID:</strong> <span className="text-purple-600">{id}</span>
            </p>
            <p>
              <strong>Status:</strong> Pending confirmation
            </p>
            <p>
              <strong>Confirmation email:</strong> Sent to your inbox 📩
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (window.location.href = "/")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Go to Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingConfirmed;
