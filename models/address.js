/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var address = sequelize.define(
		'address',
		{
			address_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			city: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			laundry_name: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			ntn_no: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			is_tax_filer: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			state: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			street_address: {
				type: DataTypes.STRING(100),
				allowNull: true
            },
            country: {
				type: DataTypes.STRING(100),
				allowNull: true
			},
			is_home_delivery: {
				type: DataTypes.INTEGER,
				allowNull: true
            },
			latitude: {
				type: DataTypes.INTEGER,
				allowNull: true
            },
			longitude: {
				type: DataTypes.INTEGER,
				allowNull: true
            }
            
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'address'
		}
	);

	return address;
};
