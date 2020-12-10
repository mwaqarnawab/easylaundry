module.exports = function(sequelize, DataTypes) {
	var services_change_requests = sequelize.define(
		'services_change_requests',
		{
			scr_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			los_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'laundry_owner_services',
					key: 'los_id'
				}
			},
			description: {
				type: DataTypes.STRING(500),
				allowNull: true
			},
			charges: {
				type: DataTypes.INTEGER,
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'services_change_requests'
		}
	);

	return services_change_requests;
};
