/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var appointment_status = sequelize.define(
		'appointment_status',
		{
			appointment_status_id: {
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
			tableName: 'appointment_status'
		}
	);

	return appointment_status;
};
