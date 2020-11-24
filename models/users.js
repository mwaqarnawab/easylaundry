/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var users = sequelize.define(
		'users',
		{
			user_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			role: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'roles',
					key: 'role_id'
				}
			},
			address: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'address',
					key: 'address_id'
				}
			},
			first_name: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			last_name: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			email: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			mobile_no: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			password: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			username: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			is_active: {
				type: DataTypes.INTEGER,
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'users'
		}
	);

	return users;
};
