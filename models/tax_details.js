/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var tax_details = sequelize.define(
		'tax_details',
		{
			td_id: {
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
			pntn_certificate: {
				type: DataTypes.BLOB('long'),
				allowNull: true
			},
			tax_percentage: {
				type: DataTypes.STRING(50),
				allowNull: true
			},
			pntn_certificate_extension:{
				type: DataTypes.STRING(50),
				allowNull: true
			}
            
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'tax_details'
		}
	);

	return tax_details;
};
