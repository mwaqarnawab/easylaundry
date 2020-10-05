/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var roles = sequelize.define(
		'roles',
		{
			role_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true
			},
			name: {
				type: DataTypes.STRING(50),
				allowNull: false
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'roles'
		}
	);

	return roles;
};
