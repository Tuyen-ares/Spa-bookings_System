// backend/config/database.js
// Load .env from backend directory (consistent with server.js)
// __dirname is backend/config/, so ../.env = backend/.env
const path = require('path');
const fs = require('fs');
const backendEnvPath = path.join(__dirname, '../.env');

// Check if backend/.env exists
if (!fs.existsSync(backendEnvPath)) {
  console.error('❌ ERROR: backend/.env file not found at:', backendEnvPath);
  console.error('Please create backend/.env with database configuration');
  process.exit(1);
}

// Load backend/.env (this has all DB config)
console.log('📁 Loading .env from:', backendEnvPath);
const envResult = require('dotenv').config({ path: backendEnvPath });

if (envResult.error) {
  console.error('❌ ERROR loading .env:', envResult.error);
} else {
  console.log('✅ Successfully loaded .env file');
}

const { Sequelize, DataTypes } = require('sequelize');

// Debug: Log environment variables (without exposing password)
console.log('=== Database Configuration ===');
console.log('DB_HOST:', process.env.DB_HOST || '❌ NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || '❌ NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || '❌ NOT SET');
console.log('DB_USER:', process.env.DB_USER || '❌ NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET (length: ' + process.env.DB_PASSWORD.length + ')' : '❌ NOT SET');

// Validate required environment variables
const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your backend/.env file');
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'anhthospa_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: parseInt(process.env.DB_PORT) || 3306,
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- Define Models ---
db.User = require('../models/User')(sequelize, DataTypes);
db.ServiceCategory = require('../models/ServiceCategory')(sequelize, DataTypes);
db.Service = require('../models/Service')(sequelize, DataTypes);
db.Appointment = require('../models/Appointment')(sequelize, DataTypes);
db.Wallet = require('../models/Wallet')(sequelize, DataTypes);
db.Promotion = require('../models/Promotion')(sequelize, DataTypes);
db.StaffAvailability = require('../models/StaffAvailability')(sequelize, DataTypes);
db.StaffShift = require('../models/StaffShift')(sequelize, DataTypes);
db.TreatmentCourse = require('../models/TreatmentCourse')(sequelize, DataTypes);
db.Payment = require('../models/Payment')(sequelize, DataTypes);
db.Review = require('../models/Review')(sequelize, DataTypes);
db.StaffTask = require('../models/StaffTask')(sequelize, DataTypes);
db.Room = require('../models/Room')(sequelize, DataTypes);
db.Notification = require('../models/Notification')(sequelize, DataTypes);
db.TreatmentSession = require('../models/TreatmentSession')(sequelize, DataTypes);
db.TreatmentCourseService = require('../models/TreatmentCourseService')(sequelize, DataTypes);
db.TreatmentPackage = require('../models/TreatmentPackage')(sequelize, DataTypes);
db.TreatmentPackageService = require('../models/TreatmentPackageService')(sequelize, DataTypes);


// --- Define Associations ---

// Note: Customer and Staff tables have been removed from database
// All user information is now stored in the users table

// Service - ServiceCategory (One-to-Many)
db.ServiceCategory.hasMany(db.Service, { foreignKey: 'categoryId' });
db.Service.belongsTo(db.ServiceCategory, { foreignKey: 'categoryId' });

// User - Wallet (One-to-One)
db.User.hasOne(db.Wallet, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Wallet.belongsTo(db.User, { foreignKey: 'userId' });

// User - Appointment (Client books many appointments)
db.User.hasMany(db.Appointment, { foreignKey: 'userId', as: 'ClientAppointments', onDelete: 'CASCADE' });
db.Appointment.belongsTo(db.User, { foreignKey: 'userId', as: 'Client' });

// User - Appointment (Staff has many appointments)
db.User.hasMany(db.Appointment, { foreignKey: 'therapistId', as: 'TherapistAppointments', onDelete: 'SET NULL' });
db.Appointment.belongsTo(db.User, { foreignKey: 'therapistId', as: 'Therapist' });

// Service - Appointment (One-to-Many)
db.Service.hasMany(db.Appointment, { foreignKey: 'serviceId', onDelete: 'CASCADE' });
db.Appointment.belongsTo(db.Service, { foreignKey: 'serviceId' });

// Note: PointsHistory and RedeemedReward tables have been removed
// Points history is now stored in wallets.pointsHistory as JSON

// User - StaffAvailability (One-to-Many)
db.User.hasMany(db.StaffAvailability, { foreignKey: 'staffId', onDelete: 'CASCADE' });
db.StaffAvailability.belongsTo(db.User, { foreignKey: 'staffId' });

// User - StaffShift (One-to-Many)
db.User.hasMany(db.StaffShift, { foreignKey: 'staffId', onDelete: 'CASCADE' });
db.StaffShift.belongsTo(db.User, { foreignKey: 'staffId' });

// User - StaffTask (Assigned To)
db.User.hasMany(db.StaffTask, { foreignKey: 'assignedToId', as: 'TasksAssignedTo', onDelete: 'CASCADE' });
db.StaffTask.belongsTo(db.User, { foreignKey: 'assignedToId', as: 'AssignedTo' });

// User - StaffTask (Assigned By)
db.User.hasMany(db.StaffTask, { foreignKey: 'assignedById', as: 'TasksAssignedBy', onDelete: 'CASCADE' });
db.StaffTask.belongsTo(db.User, { foreignKey: 'assignedById', as: 'AssignedBy' });

// Note: Product, Sale, InternalNotification, and InternalNews tables have been removed from database

// TreatmentCourse - User (Client)
db.User.hasMany(db.TreatmentCourse, { foreignKey: 'clientId', as: 'ClientCourses', onDelete: 'CASCADE' });
db.TreatmentCourse.belongsTo(db.User, { foreignKey: 'clientId', as: 'Client' });

// TreatmentCourse - User (Therapist)
db.User.hasMany(db.TreatmentCourse, { foreignKey: 'therapistId', as: 'TherapistCourses', onDelete: 'SET NULL' });
db.TreatmentCourse.belongsTo(db.User, { foreignKey: 'therapistId', as: 'Therapist' });

// TreatmentCourse - Service (DEPRECATED - use TreatmentCourseService instead)
db.Service.hasMany(db.TreatmentCourse, { foreignKey: 'serviceId', onDelete: 'CASCADE' });
db.TreatmentCourse.belongsTo(db.Service, { foreignKey: 'serviceId' });

// TreatmentCourse - Services (Many-to-Many through TreatmentCourseService)
db.TreatmentCourse.belongsToMany(db.Service, {
  through: db.TreatmentCourseService,
  foreignKey: 'treatmentCourseId',
  otherKey: 'serviceId',
  as: 'CourseServices'
});
db.Service.belongsToMany(db.TreatmentCourse, {
  through: db.TreatmentCourseService,
  foreignKey: 'serviceId',
  otherKey: 'treatmentCourseId',
  as: 'AssociatedCourses'
});

// TreatmentCourseService associations
db.TreatmentCourseService.belongsTo(db.TreatmentCourse, { foreignKey: 'treatmentCourseId' });
db.TreatmentCourseService.belongsTo(db.Service, { foreignKey: 'serviceId' });

// TreatmentPackage - Service (many-to-many)
db.TreatmentPackage.belongsToMany(db.Service, {
  through: db.TreatmentPackageService,
  foreignKey: 'treatmentPackageId',
  otherKey: 'serviceId',
  as: 'PackageServices'
});
db.Service.belongsToMany(db.TreatmentPackage, {
  through: db.TreatmentPackageService,
  foreignKey: 'serviceId',
  otherKey: 'treatmentPackageId',
  as: 'TreatmentPackages'
});

// TreatmentPackageService associations
db.TreatmentPackageService.belongsTo(db.TreatmentPackage, { foreignKey: 'treatmentPackageId' });
db.TreatmentPackageService.belongsTo(db.Service, { foreignKey: 'serviceId' });

// TreatmentCourse - TreatmentPackage (when customer registers)
db.TreatmentPackage.hasMany(db.TreatmentCourse, { foreignKey: 'packageId', as: 'EnrolledCourses' });
db.TreatmentCourse.belongsTo(db.TreatmentPackage, { foreignKey: 'packageId', as: 'Package' });

// TreatmentCourse - Appointment (initialAppointmentId)
db.Appointment.hasMany(db.TreatmentCourse, { foreignKey: 'initialAppointmentId', as: 'InitialTreatmentCourses', onDelete: 'SET NULL' });
db.TreatmentCourse.belongsTo(db.Appointment, { foreignKey: 'initialAppointmentId', as: 'InitialAppointment' });

// Payment Associations
db.User.hasMany(db.Payment, { foreignKey: 'userId', as: 'UserPayments', onDelete: 'CASCADE' });
db.Payment.belongsTo(db.User, { foreignKey: 'userId', as: 'ClientForPayment' });
db.Appointment.hasOne(db.Payment, { foreignKey: 'appointmentId', onDelete: 'SET NULL' });
db.Payment.belongsTo(db.Appointment, { foreignKey: 'appointmentId' });
// Note: Product table removed, so productId foreign key removed from Payment
db.User.hasMany(db.Payment, { foreignKey: 'therapistId', as: 'TherapistPayments', onDelete: 'SET NULL' });
db.Payment.belongsTo(db.User, { foreignKey: 'therapistId', as: 'TherapistForPayment' });

// Review Associations
db.User.hasMany(db.Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { foreignKey: 'userId' });
db.Service.hasMany(db.Review, { foreignKey: 'serviceId', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Service, { foreignKey: 'serviceId' });
db.Appointment.hasOne(db.Review, { foreignKey: 'appointmentId', onDelete: 'SET NULL' });
db.Review.belongsTo(db.Appointment, { foreignKey: 'appointmentId' });

// Room Associations
db.Room.hasMany(db.Appointment, { foreignKey: 'roomId', onDelete: 'SET NULL' });
db.Appointment.belongsTo(db.Room, { foreignKey: 'roomId' });

// Notification Associations - Temporarily disabled to avoid FK conflicts
// db.User.hasMany(db.Notification, { foreignKey: 'userId', onDelete: 'CASCADE', constraints: false });
// db.Notification.belongsTo(db.User, { foreignKey: 'userId', constraints: false });

// TreatmentSession Associations - Temporarily disabled to avoid FK conflicts
// db.TreatmentCourse.hasMany(db.TreatmentSession, { foreignKey: 'treatmentCourseId', onDelete: 'CASCADE', constraints: false });
// db.TreatmentSession.belongsTo(db.TreatmentCourse, { foreignKey: 'treatmentCourseId', constraints: false });
// db.Appointment.hasOne(db.TreatmentSession, { foreignKey: 'appointmentId', onDelete: 'SET NULL', constraints: false });
// db.TreatmentSession.belongsTo(db.Appointment, { foreignKey: 'appointmentId', constraints: false });
// db.User.hasMany(db.TreatmentSession, { foreignKey: 'therapistId', as: 'TherapistSessions', onDelete: 'SET NULL', constraints: false });
// db.TreatmentSession.belongsTo(db.User, { foreignKey: 'therapistId', as: 'Therapist', constraints: false });

// Helper to calculate total spending for a user
db.calculateUserTotalSpending = async (userId) => {
  const { total } = await db.Payment.findOne({
    where: { userId, status: 'Completed' },
    attributes: [[sequelize.fn('sum', sequelize.col('amount')), 'total']]
  });
  return total || 0;
};

// Note: Tier table removed, so tier upgrade logic is disabled
// Tier upgrade can be implemented manually if needed
db.checkAndUpgradeTier = async (userInstance, userWalletInstance) => {
  // Tier upgrade functionality disabled - Tier table removed
  return userInstance;
};

module.exports = db;