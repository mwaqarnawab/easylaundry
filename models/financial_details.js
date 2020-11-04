module.exports = function(sequelize, DataTypes) {
	var financial_details = sequelize.define(
		'financial_details',
		{
			fd_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			user: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'users',
					key: 'user_id'
				}
			},
			total_earning: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			total_spending: {
				type: DataTypes.INTEGER,
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'financial_details'
		}
	);

	return financial_details;
};
