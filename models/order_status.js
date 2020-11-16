/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var order_status = sequelize.define(
		'order_status',
		{
			order_status_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			status: {
				type: DataTypes.STRING(20),
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'order_status'
		}
	);

	return order_status;
};
