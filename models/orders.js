/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var orders = sequelize.define(
		'orders',
		{
			order_id: {
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
            order_status: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'order_status',
					key: 'order_status_id'
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
			pickup_address: {
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
			tableName: 'orders'
		}
	);

	return orders;
};
