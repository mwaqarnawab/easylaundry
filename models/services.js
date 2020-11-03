module.exports = function(sequelize, DataTypes) {
	var services = sequelize.define(
		'services',
		{
			service_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			service_category: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'service_categories',
					key: 'category_id'
				}
			},
			service_name: {
				type: DataTypes.STRING(200),
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'services'
		}
	);

	return services;
};
