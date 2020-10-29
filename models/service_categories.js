module.exports = function(sequelize, DataTypes) {
	var service_categories = sequelize.define(
		'service_categories',
		{
			category_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true
			},
			category: {
				type: DataTypes.STRING(50),
				allowNull: false
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'service_categories'
		}
	);

	return service_categories;
};
