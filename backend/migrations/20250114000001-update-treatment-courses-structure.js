// Migration: Update TreatmentCourse to support multiple services
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns already exist
      const tableDescription = await queryInterface.describeTable('treatment_courses');
      
      // 1. Add new columns to treatment_courses (if not exist)
      if (!tableDescription.name) {
        await queryInterface.addColumn('treatment_courses', 'name', {
          type: Sequelize.STRING,
          allowNull: true, // Temporarily allow null for migration
          comment: 'Tên gói liệu trình'
        }, { transaction });
      }

      if (!tableDescription.price) {
        await queryInterface.addColumn('treatment_courses', 'price', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true, // Temporarily allow null for migration
          comment: 'Giá của gói liệu trình'
        }, { transaction });
      }

      // 2. Create treatment_course_services junction table (if not exist)
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('treatment_course_services')) {
        // Create table WITHOUT foreign keys first, specifying charset/collation
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS treatment_course_services (
            id INTEGER AUTO_INCREMENT,
            treatmentCourseId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            serviceId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            serviceName VARCHAR(255) NOT NULL COMMENT 'Cached service name for performance',
            \`order\` INTEGER DEFAULT 0 COMMENT 'Thứ tự thực hiện dịch vụ trong liệu trình',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `, { transaction });

        // Add foreign key constraints separately
        await queryInterface.addConstraint('treatment_course_services', {
          fields: ['treatmentCourseId'],
          type: 'foreign key',
          name: 'fk_tcs_treatment_course',
          references: {
            table: 'treatment_courses',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          transaction
        });

        await queryInterface.addConstraint('treatment_course_services', {
          fields: ['serviceId'],
          type: 'foreign key',
          name: 'fk_tcs_service',
          references: {
            table: 'services',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          transaction
        });

        // 3. Add index for better query performance
        await queryInterface.addIndex('treatment_course_services', ['treatmentCourseId'], {
          name: 'idx_tcs_course_id',
          transaction
        });

        await queryInterface.addIndex('treatment_course_services', ['serviceId'], {
          name: 'idx_tcs_service_id',
          transaction
        });
      } // Close if (!tables.includes('treatment_course_services'))

      // 4. Migrate existing data from serviceId to junction table
      // Get all existing treatment courses with serviceId
      const [existingCourses] = await queryInterface.sequelize.query(`
        SELECT id, serviceId, serviceName 
        FROM treatment_courses 
        WHERE serviceId IS NOT NULL
      `, { transaction });

      // Populate name from serviceName and set default price
      for (const course of existingCourses) {
        // Update name = serviceName (as it was single service before)
        await queryInterface.sequelize.query(`
          UPDATE treatment_courses 
          SET name = CONCAT('Liệu trình ', serviceName),
              price = (SELECT price FROM services WHERE id = ? LIMIT 1)
          WHERE id = ?
        `, {
          replacements: [course.serviceId, course.id],
          transaction
        });

        // Insert into junction table
        await queryInterface.sequelize.query(`
          INSERT INTO treatment_course_services (treatmentCourseId, serviceId, serviceName, \`order\`)
          VALUES (?, ?, ?, 1)
        `, {
          replacements: [course.id, course.serviceId, course.serviceName],
          transaction
        });
      }

      // 5. Make name and price NOT NULL after migration
      await queryInterface.changeColumn('treatment_courses', 'name', {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Tên gói liệu trình'
      }, { transaction });

      await queryInterface.changeColumn('treatment_courses', 'price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Giá của gói liệu trình'
      }, { transaction });

      // 6. Keep serviceId and serviceName for backward compatibility
      // They will be deprecated in future versions
      
      await transaction.commit();
      console.log('✓ Migration completed: Updated treatment courses structure');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop junction table
      await queryInterface.dropTable('treatment_course_services', { transaction });

      // Remove new columns
      await queryInterface.removeColumn('treatment_courses', 'name', { transaction });
      await queryInterface.removeColumn('treatment_courses', 'price', { transaction });

      await transaction.commit();
      console.log('✓ Rollback completed: Reverted treatment courses structure');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Rollback failed:', error);
      throw error;
    }
  }
};
