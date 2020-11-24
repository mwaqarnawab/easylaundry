/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var appointment_ratings_reviews = sequelize.define(
		'appointment_ratings_reviews',
		{
			arr_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			appointment: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'appointments',
					key: 'appointment_id'
				}
            },
            laundry_owner: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'users',
					key: 'user_id'
				}
			},
			rating: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			customer: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			reviews: {
				type: DataTypes.STRING(450),
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'appointment_ratings_reviews'
		}
	);

	return appointment_ratings_reviews;
};
