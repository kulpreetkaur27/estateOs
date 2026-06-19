const User = require('../models/User');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const RealtorAvailability = require('../models/RealtorAvailability');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");
const { createZoomMeeting } = require("../services/zoomService");

const { ImgurClient } = require('imgur');
const path = require('path');
const fs = require('fs');

const imgurClient = new ImgurClient({
  clientId: process.env.IMGUR_CLIENT_ID
});


// Helper function to fetch realtor email by realtorId
const getRealtorEmail = async (realtorId) => {
  const realtor = await User.findById(realtorId);
  return realtor ? realtor.email : null;
};

// Convert a stream into a buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Upload a single file to Imgur and return the image URL
const uploadFileToImgur = async (file) => {
  // If the file object has a promise property, wait for it.
  const resolvedFile = file.promise ? await file.promise : file;
  const { createReadStream } = resolvedFile;
  const stream = createReadStream();
  const buffer = await streamToBuffer(stream);
  const base64Image = buffer.toString('base64');
  // Pass your client ID as the second parameter since setClientId is not available.
  const response = await imgurClient.upload({
    image: base64Image,
    type: 'base64'
  });
  return response.data.link;
};

// Upload an array of files to Imgur and return an array of image URLs
const uploadFilesToImgur = async (files) => {
  const urls = await Promise.all(files.map(file => uploadFileToImgur(file)));
  console.log('Uploaded URLs:', urls);
  return urls;
};

const generateTimeSlots = (startHour = 9, endHour = 18) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    slots.push({ startTime: start, endTime: end });
  }
  return slots;
};

const displayMode = (mode) => {
  const map = {
    IN_PERSON: "In Person",
    ZOOM: "Zoom"
  };
  return map[mode] || mode;
};



module.exports = {

  Query: {
    async getUsers() {
      return await User.find();
    },
    async getUserById(_, { id }) {
      return await User.findById(id);
    },
    // Updated getBookings to accept an optional realtorId parameter.
    async getBookings(_, { realtorId }) {
      const query = realtorId ? { realtor: realtorId } : {};
      return await Booking.find(query).populate('client').populate('realtor').populate('property').populate('created_by');
    },

    getAllProperties: async (_, { filter }) => {
      let query = { archived: false };  // Ensure only active properties are returned
      if (filter) {
        if (filter.realtor) query.realtor = filter.realtor;
        if (filter.propertyType) query.propertyType = filter.propertyType;
        if (filter.minPrice !== undefined) query.price = { $gte: filter.minPrice };
        if (filter.maxPrice !== undefined)
          query.price = { ...query.price, $lte: filter.maxPrice };
        if (filter.bedrooms !== undefined) query.bedrooms = filter.bedrooms;
        if (filter.bathrooms !== undefined) query.bathrooms = filter.bathrooms;
        if (filter.location) query.location = filter.location;
        if (filter.dateListed) query.createdAt = { $gte: new Date(filter.dateListed) };
      }
      let sort = {};
      if (filter && filter.sort) {
        switch (filter.sort) {
          case "newest":
            sort = { createdAt: -1 };
            break;
          case "oldest":
            sort = { createdAt: 1 };
            break;
          case "highestPrice":
            sort = { price: -1 };
            break;
          case "lowestPrice":
            sort = { price: 1 };
            break;
          default:
            sort = { createdAt: -1 };
        }
      }
      return await Property.find(query).sort(sort).populate('realtor');
    },
    
    getUniqueLocations: async () => {
      const locations = await Property.distinct('location');
      return locations;
    },
    getPropertyById: async (_, { id }) => {
      return await Property.findById(id).populate('realtor');
    },
 
    getAvailableSlots: async (_, { date, propertyId, realtorId }) => {
      try {
        if (!date || !propertyId || !realtorId) {
          throw new Error("Date, Property ID, and Realtor ID are required");
        }

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // ✅ Step 1: Get bookings for this date, property, and realtor
        const selectedDate = new Date(date).toISOString().split("T")[0];
        
        const bookings = await Booking.find({
          property: propertyId,
          realtor: realtorId,
          $expr: {
            $eq: [
              { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              selectedDate
            ]
          }
        });

        console.log("📅 Bookings found:", bookings.length);
        bookings.forEach(b => {
          console.log(`⛔ Booking: ${b.startTime} - ${b.endTime} (Date: ${b.date})`);
        });

        // ✅ Step 2: Generate all slots
        const allSlots = generateTimeSlots(); // e.g., 9am to 6pm
        console.log("🕒 Generated Slots:", allSlots.map(s => `${s.startTime}-${s.endTime}`));

        // ✅ Step 3: Filter out overlapping slots
        const availableSlots = allSlots.filter(slot => {
          const slotStart = parseInt(slot.startTime.replace(":", ""));
          const slotEnd = parseInt(slot.endTime.replace(":", ""));

          const overlapping = bookings.some(booking => {
            const bookingStart = parseInt(booking.startTime.replace(":", ""));
            const bookingEnd = parseInt(booking.endTime.replace(":", ""));

            const doesOverlap = slotStart < bookingEnd && slotEnd > bookingStart;

            if (doesOverlap) {
              console.log(
                `❌ Slot ${slot.startTime}-${slot.endTime} overlaps with Booking ${booking.startTime}-${booking.endTime}`
              );
            }

            return doesOverlap;
          });

          return !overlapping;
        });

        console.log("✅ Available Slots:", availableSlots);

        return availableSlots;
      } catch (err) {
        console.error("❗ getAvailableSlots error:", err);
        throw new Error("Failed to fetch available slots: " + err.message);
      }
    },
    
    getRealtorAvailability: async (_, { realtorId }) => {
      try {
        const baseQuery = realtorId ? { realtor: realtorId } : {};
        // Add condition to filter out deleted records
        const query = { ...baseQuery, deleted: false };
        const availabilityData = await RealtorAvailability.find(query).populate('realtor');
        return availabilityData;
      } catch (error) {
        console.error("Error fetching realtor availability:", error);
        throw new Error("Failed to fetch realtor availability.");
      }
    },

    async getUniqueClients(_, { realtorId }) {
      try {
        const bookings = await Booking.find({ realtor: realtorId }).populate('client');
        const uniqueClientsMap = new Map();
        bookings.forEach(booking => {
          if (booking.client && !uniqueClientsMap.has(booking.client.id)) {
            // Ensure the keys match your User type: firstName, lastName, email, etc.
            uniqueClientsMap.set(booking.client.id, {
              id: booking.client.id,
              firstName: booking.client.firstName,  // not "firstname"
              lastName: booking.client.lastName,
              email: booking.client.email
            });
          }
        });
        return Array.from(uniqueClientsMap.values());
      } catch (error) {
        console.error("Error fetching unique clients:", error);
        throw new Error("Failed to fetch unique clients.");
      }
    },
    
    async getRealtorProperties(_, { realtorId }) {
      try {
        const properties = await Property.find({ realtor: realtorId, archived: false });

        return properties.map(prop => ({
          id: prop.id,
          title: prop.title,
          location: prop.location,
        }));
      } catch (error) {
        console.error("Error fetching realtor properties:", error);
        throw new Error("Failed to fetch realtor properties.");
      }
    },
    getBookingsByClient: async (_, { clientId }) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      // Fetch bookings for the authenticated user (client)
      const bookings = await Booking.find({ client: clientId })  .populate('client') 
      .populate('realtor')  
      .populate('property') 
      .populate('created_by'); 
      return bookings;
    },
    
  },
  Mutation: {
    async createUser(_, { input, profilePicture }) {
      try {
        const { firstName, lastName, gender, phoneNumber, email, password, confirmPassword, role } = input;
    
        // Validate required fields
        if (!firstName || !lastName || !gender || !phoneNumber || !email || !password || !confirmPassword) {
          throw new Error('All fields are required.');
        }
    
        // Confirm password matches
        if (password !== confirmPassword) {
          throw new Error('Password and Confirm Password must match.');
        }
    
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format.');
        }
    
        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
        }
    
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('Email is already registered.');
        }
    
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Use Imgur upload for profile picture if provided
        let profilePictureUrl = '/uploads/default-profile.jpg'; // fallback default
        if (profilePicture) {
          profilePictureUrl = await uploadFileToImgur(profilePicture);
        }
    
        // Create new user
        const newUser = new User({
          firstName,
          lastName,
          gender,
          phoneNumber,
          email,
          password: hashedPassword,
          confirmPassword: hashedPassword,
          profilePicture: profilePictureUrl,
          role,
        });
    
        return await newUser.save();
      } catch (error) {
        throw new Error(error.message);
      }
    },

    async login(_, { email, password }) {
      try {
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials.');
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return { token, user };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    async updateUser(_, { id, input, profilePicture }) {
      const updatedUserData = input;
    
      // Use Imgur upload for new profile picture if provided
      console.log('Profile Picture:', profilePicture);
      if (profilePicture) {
        updatedUserData.profilePicture = await uploadFileToImgur(profilePicture);
      }
    
      const updatedUser = await User.findByIdAndUpdate(id, updatedUserData, { new: true });
      if (!updatedUser) {
        throw new Error('User not found');
      }
    
      return updatedUser;
    },

    async deleteUser(_, { id }) {
      const deletedUser = await User.findByIdAndDelete(id);
      return !!deletedUser;
    },

    async resetPassword(_, { input }){
      const { email } = input;

      if (!email) {
        throw new Error('Please enter your email address.');
      }
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('No account found with this email.');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      const resetLink = `${process.env.APP_URL}reset-password?token=${resetToken}`;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Your Company" <no-reply@real-state.com>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}" target="_blank">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        return user;
      } catch (error) {
        throw new Error('Error sending email. Please try again.');
      }
    },

    async resetPasswordWithToken(_, { input }) {
      try {
        const { token, password } = input;
  
        if (!token || !password) {
          throw new Error('Invalid request. Please provide all the fields');
        }
  
        const user = await User.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() }, 
        });
  
        if (!user) {
          throw new Error('Invalid or expired reset token.');
        }
  
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error(
            'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
          );
        }
  
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
  
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
  
        await user.save();
  
        return {
          success: true,
          message: 'Your password has been successfully updated. Redirecting to login...',
          redirectTo: '/login',
        };
      } catch (error) {
        console.error('Reset Password Error:', error.message);
        throw new Error(error.message || 'Something went wrong. Please try again.');
      }
    },
    createBooking: async (_, { input }) => {
      try {
        // If a slot is provided, extract start and end times.
        if (input.slot) {
          const [startTime, endTime] = input.slot.split(" - ");
          input.startTime = startTime.trim();
          input.endTime = endTime.trim();
        }
    
        // Validate that all required fields are provided.
        const requiredFields = [
          "date",
          "startTime",
          "endTime",
          "mode",
          "status",
          "propertyId",
          "realtorId",
          "clientId",
          "name",
          "email",
          "phone",
        ];
    
        requiredFields.forEach((field) => {
          if (!input[field]) {
            throw new Error(`${field} is required.`);
          }
        });
    
        // Validate name (minimum 2 characters).
        if (input.name.trim().length < 2) {
          throw new Error("Name must be at least 2 characters.");
        }
    
        // Validate email format.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email)) {
          throw new Error("Invalid client email address.");
        }
    
        // Validate Canadian phone format: XXX-XXX-XXXX.
        const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
        if (!phoneRegex.test(input.phone)) {
          throw new Error("Phone number must be in XXX-XXX-XXXX format.");
        }
    
        // Create new booking using the provided input.
        const newBooking = new Booking({
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          mode: input.mode,
          notes: input.notes,
          status: input.status,
          property: input.propertyId,
          realtor: input.realtorId,
          client: input.clientId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          isRealtor: false
        });
    
        const savedBooking = await newBooking.save();
    
        // Prepare email content for the client.
        const clientEmailBody = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 650px; margin: auto; line-height: 1.6; padding: 20px;">
            <h1 style="text-align: center; color: #6B46C1;">🎉 Your Booking is Confirmed!</h1>
            <p>Hi <strong>${input.name}</strong>,</p>
            <p>
              We're thrilled to let you know that your property viewing appointment has been successfully scheduled! 🏡<br />
              ✅ A confirmation will land in your inbox within 4 hours.<br />
              Here are your booking details:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.date}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Time Slot:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.startTime} – ${input.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Mode:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${displayMode(input.mode)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Status:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.status}</td>
              </tr>
              ${input.notes ? `
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Notes:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.notes}</td>
              </tr>` : ""}
            </table>
            <p>
              📩 A confirmation message has been sent to your registered email.<br />
              ✅ You’ll receive updates via WhatsApp/SMS shortly.
            </p>
            <p style="margin-top: 30px; text-align: center;">
              <a href="http://localhost:5173/" style="display: inline-block; background-color: #6B46C1; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                View My Bookings
              </a>
            </p>
            <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #888; text-align: center;">
              This email was sent by Your Booking Team · <a href="http://localhost:5173/" style="color: #6B46C1;">Visit Website</a>
            </p>
          </div>
        `;
        await sendEmail(input.email, "Booking Request Received", clientEmailBody, false);
    
        // Notify the realtor via email.
        const realtorEmail = await getRealtorEmail(input.realtorId);
        const realtorEmailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333; padding: 20px;">
            <h2 style="text-align: center; color: #6B46C1;">📩 New Booking Request</h2>
            <p>Hello <strong>Realtor</strong>,</p>
            <p>
              A new client has just requested a property booking. Please review the details below and take action accordingly:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.date}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Time Slot:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.startTime} – ${input.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Mode:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${displayMode(input.mode)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Client:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.name} (<a href="mailto:${input.email}" style="color: #6B46C1;">${input.email}</a>)</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Notes:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${input.notes || "N/A"}</td>
              </tr>
            </table>
            <p style="margin-top: 24px;">
              👉 <a href="http://localhost:5173/realtor-portal/appointments" style="background-color: #6B46C1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirm or Deny Booking
              </a>
            </p>
            <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #888; text-align: center;">
              This email was sent by Your Booking System · <a href="http://yourdomain.com" style="color: #6B46C1;">Visit Dashboard</a>
            </p>
          </div>
        `;
        await sendEmail(realtorEmail, "New Booking Request - Action Required", realtorEmailBody, false);
    
        // Return the booking details.
        return {
          id: savedBooking._id.toString(),
          date: savedBooking.date.toISOString(),
          startTime: savedBooking.startTime,
          endTime: savedBooking.endTime,
          mode: savedBooking.mode,
          notes: savedBooking.notes,
          status: savedBooking.status,
          propertyId: input.propertyId.toString(),
          name: savedBooking.name,
          email: savedBooking.email,
          phone: savedBooking.phone,
          createdAt: savedBooking.createdAt.toISOString(),
          updatedAt: savedBooking.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error("❌ Booking Error:", error);
        throw new Error("Failed to create booking: " + error.message);
      }
    },    
    
    
    updateBookingStatus: async (_, { id, status }) => {
      try {
        // 1. Find the booking by ID
        const booking = await Booking.findById(id) .populate("client")
        .populate("realtor").populate('property');
        if (!booking) {
          throw new Error("Booking not found");
        }
    
        // 2. Update status based on provided argument
        if (status === "CONFIRMED") {
          booking.status = status;
    
          // Set meeting details based on mode
          if (booking.mode === "ZOOM") {
            booking.zoomLink = await createZoomMeeting();
          } else {
            booking.officeAddress = "1234 Real Estate Office, Toronto, ON";
          }
        } else if (status === "CANCELLED") {
          booking.status = status;
        } else {
          throw new Error("Invalid status provided");
        }
    
        // 3. Save the updated booking
        await booking.save();
    
        // 4. Build the email content for both client and realtor
        let emailSubject;
        let emailBody;
    
        if (status === "CONFIRMED") {
          emailSubject = "Your Appointment is Confirmed";
          emailBody = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 650px; margin: auto; line-height: 1.6; padding: 20px;">
              <h1 style="text-align: center; color: #6B46C1;">🎉 Your Appointment is Confirmed!</h1>
              <p>Hi,</p>
              <p>We’re excited to confirm your property viewing appointment! 🏡</p>
              <p>Here are your booking details:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Date:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Time Slot:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.startTime} – ${booking.endTime}</td>
                </tr>
                 <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Realtor:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.realtor.firstName}  ${booking.realtor.lastName}</td>
                </tr>
                 <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Client:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.client.firstName}  ${booking.client.lastName}</td>
                </tr>
                 <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Property:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.property.location}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Mode:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.mode}</td>
                </tr>
                ${booking.zoomLink ? `
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Zoom Link:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">
                    <a href="${booking.zoomLink}" target="_blank" style="color: #6B46C1; text-decoration: none;">${booking.zoomLink}</a>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Status:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">
                    <span style="color: #fff; background-color: ${booking.status === 'CONFIRMED' ? '#4CAF50' : '#FFC107'}; padding: 5px 10px; border-radius: 5px;">
                      ${booking.status}
                    </span>
                  </td>
                </tr>
              </table>
              <p>Thank you for booking with us! We look forward to seeing you.</p>
              <p style="margin-top: 30px; text-align: center;">
                <a href="http://localhost:5173/" style="display: inline-block; background-color: #6B46C1; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                  View My Bookings
                </a>
              </p>
              <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #888; text-align: center;">
                This email was sent by Your Booking Team · <a href="http://localhost:5173/" style="color: #6B46C1;">Visit Website</a>
              </p>
            </div>
          `;
        } else if (status === "CANCELLED") {
          emailSubject = "Your Appointment has been Cancelled";
          emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px;">
              <h1 style="text-align: center; color: #e11d48;">❌ Your Appointment has been Cancelled</h1>
              <p>Hi,</p>
              <p>We regret to inform you that your appointment has been cancelled. Please see the details below:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Date:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Time Slot:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.startTime} – ${booking.endTime}</td>
                </tr>
                   <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Realtor:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.realtor.firstName}  ${booking.realtor.lastName}</td>
                </tr>
                 <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Client:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.client.firstName} ${booking.client.lastName}</td>
                </tr>
                 <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Property:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.property.location}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background-color: #f9f9f9;"><strong>Mode:</strong></td>
                  <td style="padding: 10px; border: 1px solid #eee; background-color: #f9f9f9;">${booking.mode}</td>
                </tr>
              </table>
              <p>If you wish to reschedule, please contact us.</p>
              <p style="margin-top: 30px; text-align: center;">
                <a href="http://localhost:5173/" style="display: inline-block; background-color: #e11d48; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                  View My Bookings
                </a>
              </p>
              <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #888; text-align: center;">
                This email was sent by Your Booking Team · <a href="http://localhost:5173/" style="color: #e11d48;">Visit Website</a>
              </p>
            </div>
          `;
        }
        const clientEmail = booking.email || booking.client.email;

        // 5. Send email to the client
        await sendEmail(clientEmail, emailSubject, emailBody);
    
        // send email to the realtor if available
        if (booking.realtor.email) {
          const realtorSubject = status === "CONFIRMED" ? "New Appointment Confirmed" : "Appointment Cancelled";
          await sendEmail(booking.realtor.email, realtorSubject, emailBody);
        }
    
        // 7. Return the updated booking
        return booking;
    
      } catch (err) {
        console.error("❌ Error updating booking status:", err);
        throw new Error("Failed to update booking status: " + err.message);
      }
    },
    
    
    createRealtorBooking: async (_, { input }, { db }) => {
      try {
        // Create and save a new booking
        const booking = new Booking({
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          mode: input.mode,
          notes: input.notes,
          status: input.status || "PENDING",
          client: input.clientId,
          property: input.propertyId,
          created_by: input.created_by,
          createdAt: new Date().toISOString(),
          realtor: input.realtorId,
          isRealtor: true
        });

        const savedBooking = await booking.save();
        return savedBooking ? true : false;
        

      } catch (error) {
        console.error("Error creating realtor booking:", error);
        throw new Error("Failed to create realtor booking: " + error.message);
      }
    },
    
    addProperty: async (_, args) => {
      try {
        if (args.images && args.images.length) {
          // Upload each image file to Imgur and replace the files array with the returned URLs
          args.images = await uploadFilesToImgur(args.images);
        }
        const newProperty = new Property(args);
        await newProperty.save();
        return newProperty.populate('realtor');
      } catch (error) {
        throw new Error("Error adding property: " + error.message);
      }
    },

    updateProperty: async (_, { id, ...updates }) => {
      try {
        if (updates.images && updates.images.length) {
          // Upload new image files to Imgur and update the images field with the returned URLs
          updates.images = await uploadFilesToImgur(updates.images);
        }
        const updatedProperty = await Property.findByIdAndUpdate(id, updates, { new: true }).populate('realtor');
        if (!updatedProperty) throw new Error("Property not found");
        return updatedProperty;
      } catch (error) {
        throw new Error("Error updating property: " + error.message);
      }
    },

    deleteProperty: async (_, { id }) => {
      try {
        const updatedProperty = await Property.findByIdAndUpdate(
          id,
          { archived: true },
          { new: true }
        );
        if (!updatedProperty) throw new Error("Property not found");
        return "Property archived successfully";
      } catch (error) {
        throw new Error("Error archiving property");
      }
    },
    async createRealtorAvailability(_, { input }) {
      try {
        // Create a new record using the input provided.
        const availability = new RealtorAvailability(input);
        // Save the record to the database
        const savedAvailability = await availability.save();
        return savedAvailability;
      } catch (error) {
        console.error("❌ Error saving availability:", error);
        throw new Error("Failed to save availability: " + error.message);
      }
    },
    

    cancelRealtorAvailability: async (_, { input }) => {
      try {
        console.log("TEST", input);
        const { id } = input;
        // Find the time off record by id
        const updatedAvailability = await RealtorAvailability.findByIdAndUpdate(id,  { deleted: true });
        if (!updatedAvailability) {
          throw new Error("Time off record not found");
        }
        return updatedAvailability;
      } catch (error) {
        console.error("Error canceling time off:", error);
        throw new Error("Failed to cancel time off");
      }
    },
    
  },

  Property: {
    realtor: async (property) => {
      return await User.findById(property.realtor);
    },
  },

  Booking: {
    date: (booking) => new Date(booking.date).toISOString(),
    client: async (booking) => {
      // If already populated, return the client object directly.
      if (booking.client && typeof booking.client === 'object' && booking.client._id) {
        console.log("🔍 Using cached client data", booking.client);
        return booking.client;
      }
      // Otherwise, attempt to fetch it.
      const clientData = await User.findById(booking.client);
      if (!clientData) {
        // You can either throw an error or return a placeholder.
        throw new Error("Client not found for booking " + booking._id);
        // or return null if you update your schema to allow null.
      }
      return booking.client;
    },
    realtor: async (booking) => {
      return await User.findById(booking.realtor);
    }
  }
};
