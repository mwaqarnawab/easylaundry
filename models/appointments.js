/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var appointments = sequelize.define(
		'appointments',
		{
			appointment_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			los: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'laundry_owner_services',
					key: 'los_id'
				}
			},
			customer: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'users',
					key: 'user_id'
				}
            },
            appointment_status: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'appointment_status',
					key: 'appointment_status_id'
				}
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			laundry_owner_id: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			appointment_time: {
				type: DataTypes.STRING(450),
				allowNull: true
			},
			comment: {
				type: DataTypes.STRING(499),
				allowNull: true
			},
			total_price: {
				type: DataTypes.INTEGER,
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'appointments'
		}
	);

	return appointments;
};
