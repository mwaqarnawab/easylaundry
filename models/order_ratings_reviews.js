/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var order_ratings_reviews = sequelize.define(
		'order_ratings_reviews',
		{
			orr_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			order: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'orders',
					key: 'order_id'
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
			tableName: 'order_ratings_reviews'
		}
	);

	return order_ratings_reviews;
};
