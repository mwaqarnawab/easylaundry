module.exports = function(sequelize, DataTypes) {
	var laundry_owner_services = sequelize.define(
		'laundry_owner_services',
		{
			los_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			laundry_owner: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'users',
					key: 'user_id'
				}
			},
			service: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'services',
					key: 'service_id'
				}
			},
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'laundry_owner_services'
		}
	);

	return laundry_owner_services;
};
