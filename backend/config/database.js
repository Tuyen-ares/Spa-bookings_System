// backend/config/database.js
require('dotenv').config({ path: __dirname + '/../.env' });
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql', // Changed to mysql
    port: process.env.DB_PORT,
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- Define Models ---
db.Tier = require('../models/Tier')(sequelize, DataTypes);
db.StaffTier = require('../models/StaffTier')(sequelize, DataTypes);
db.User = require('../models/User')(sequelize, DataTypes);
db.Customer = require('../models/Customer')(sequelize, DataTypes);
db.Staff = require('../models/Staff')(sequelize, DataTypes);
db.ServiceCategory = require('../models/ServiceCategory')(sequelize, DataTypes);
db.Service = require('../models/Service')(sequelize, DataTypes);
db.Appointment = require('../models/Appointment')(sequelize, DataTypes);
db.Wallet = require('../models/Wallet')(sequelize, DataTypes);
db.Promotion = require('../models/Promotion')(sequelize, DataTypes);
db.RedeemableVoucher = require('../models/RedeemableVoucher')(sequelize, DataTypes);
db.PointsHistory = require('../models/PointsHistory')(sequelize, DataTypes);
db.RedeemedReward = require('../models/RedeemedReward')(sequelize, DataTypes);
db.Mission = require('../models/Mission')(sequelize, DataTypes);
db.StaffAvailability = require('../models/StaffAvailability')(sequelize, DataTypes);
db.StaffShift = require('../models/StaffShift')(sequelize, DataTypes);
db.Product = require('../models/Product')(sequelize, DataTypes);
db.Sale = require('../models/Sale')(sequelize, DataTypes);
db.InternalNotification = require('../models/InternalNotification')(sequelize, DataTypes);
db.InternalNews = require('../models/InternalNews')(sequelize, DataTypes);
db.TreatmentCourse = require('../models/TreatmentCourse')(sequelize, DataTypes);
db.Payment = require('../models/Payment')(sequelize, DataTypes);
db.Review = require('../models/Review')(sequelize, DataTypes);
db.StaffTask = require('../models/StaffTask')(sequelize, DataTypes);


// --- Define Associations ---

// User has one CustomerProfile or one StaffProfile
db.User.hasOne(db.Customer, { foreignKey: 'userId', as: 'customerProfile', onDelete: 'CASCADE' });
db.Customer.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasOne(db.Staff, { foreignKey: 'userId', as: 'staffProfile', onDelete: 'CASCADE' });
db.Staff.belongsTo(db.User, { foreignKey: 'userId' });

// CustomerProfile is associated with a Tier
db.Tier.hasMany(db.Customer, { foreignKey: 'tierLevel', sourceKey: 'level' });
db.Customer.belongsTo(db.Tier, { foreignKey: 'tierLevel', targetKey: 'level', as: 'Tier' });

// StaffProfile is associated with a StaffTier
db.StaffTier.hasMany(db.Staff, { foreignKey: 'staffTierId' });
db.Staff.belongsTo(db.StaffTier, { foreignKey: 'staffTierId', as: 'StaffTier' });

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

// User - PointsHistory (One-to-Many)
db.User.hasMany(db.PointsHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.PointsHistory.belongsTo(db.User, { foreignKey: 'userId' });

// User - RedeemedReward (One-to-Many)
db.User.hasMany(db.RedeemedReward, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.RedeemedReward.belongsTo(db.User, { foreignKey: 'userId' });

// User - Mission (One-to-Many)
db.User.hasMany(db.Mission, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Mission.belongsTo(db.User, { foreignKey: 'userId' });

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

// User - Sale (Staff sells products)
db.User.hasMany(db.Sale, { foreignKey: 'staffId', as: 'SalesMade', onDelete: 'SET NULL' });
db.Sale.belongsTo(db.User, { foreignKey: 'staffId', as: 'Staff' });

// Product - Sale (One-to-Many)
db.Product.hasMany(db.Sale, { foreignKey: 'productId', onDelete: 'SET NULL' });
db.Sale.belongsTo(db.Product, { foreignKey: 'productId' });

// User - InternalNotification (User receives notifications)
db.User.hasMany(db.InternalNotification, { foreignKey: 'recipientId', onDelete: 'CASCADE' });
db.InternalNotification.belongsTo(db.User, { foreignKey: 'recipientId' });

// User - InternalNews (Admin/Manager authors news)
db.User.hasMany(db.InternalNews, { foreignKey: 'authorId', onDelete: 'SET NULL' });
db.InternalNews.belongsTo(db.User, { foreignKey: 'authorId' });

// TreatmentCourse - User (Client)
db.User.hasMany(db.TreatmentCourse, { foreignKey: 'clientId', as: 'ClientCourses', onDelete: 'CASCADE' });
db.TreatmentCourse.belongsTo(db.User, { foreignKey: 'clientId', as: 'Client' });

// TreatmentCourse - User (Therapist)
db.User.hasMany(db.TreatmentCourse, { foreignKey: 'therapistId', as: 'TherapistCourses', onDelete: 'SET NULL' });
db.TreatmentCourse.belongsTo(db.User, { foreignKey: 'therapistId', as: 'Therapist' });

// TreatmentCourse - Service
db.Service.hasMany(db.TreatmentCourse, { foreignKey: 'serviceId', onDelete: 'CASCADE' });
db.TreatmentCourse.belongsTo(db.Service, { foreignKey: 'serviceId' });

// Payment Associations
db.User.hasMany(db.Payment, { foreignKey: 'userId', as: 'UserPayments', onDelete: 'CASCADE' });
db.Payment.belongsTo(db.User, { foreignKey: 'userId', as: 'ClientForPayment' });
db.Appointment.hasOne(db.Payment, { foreignKey: 'appointmentId', onDelete: 'SET NULL' });
db.Payment.belongsTo(db.Appointment, { foreignKey: 'appointmentId' });
db.Product.hasMany(db.Payment, { foreignKey: 'productId', onDelete: 'SET NULL' });
db.Payment.belongsTo(db.Product, { foreignKey: 'productId' });
db.User.hasMany(db.Payment, { foreignKey: 'therapistId', as: 'TherapistPayments', onDelete: 'SET NULL' });
db.Payment.belongsTo(db.User, { foreignKey: 'therapistId', as: 'TherapistForPayment' });

// Review Associations
db.User.hasMany(db.Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { foreignKey: 'userId' });
db.Service.hasMany(db.Review, { foreignKey: 'serviceId', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Service, { foreignKey: 'serviceId' });
db.Appointment.hasOne(db.Review, { foreignKey: 'appointmentId', onDelete: 'SET NULL' });
db.Review.belongsTo(db.Appointment, { foreignKey: 'appointmentId' });

// Helper to calculate total spending for a user
db.calculateUserTotalSpending = async (userId) => {
  const { total } = await db.Payment.findOne({
      where: { userId, status: 'Completed' },
      attributes: [[sequelize.fn('sum', sequelize.col('amount')), 'total']]
  });
  return total || 0;
};

// Helper function to check and upgrade tier based on points and spending
db.checkAndUpgradeTier = async (userInstance, userWalletInstance) => {
    let customerProfile = await userInstance.getCustomerProfile();
    const tiers = await db.Tier.findAll({ order: [['level', 'ASC']] });
    let needsUpdate = false;

    for (const tier of tiers) {
        if (tier.level > customerProfile.tierLevel) {
            if (userWalletInstance.points >= tier.pointsRequired && customerProfile.totalSpending >= tier.minSpendingRequired) {
                customerProfile.tierLevel = tier.level;
                customerProfile.lastTierUpgradeDate = new Date();
                needsUpdate = true;
            } else {
                break; 
            }
        }
    }
    if (needsUpdate) {
        await customerProfile.save();
    }
    return userInstance; // Return the original instance, which now has its association updated
};

module.exports = db;